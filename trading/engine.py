"""Honest daily backtest engine.

Timing: a signal / weight row dated t is computed from data up to the close of
day t and is executed at the OPEN of day t+1 (internally `weights.shift(1)`).
Costs: (fee + slippage) charged on traded notional (per side).
Long-only, no leverage (sum of weights <= 1, remainder in cash earning 0).
Equity is simulated in USD and converted to CHF with USDCHF close of each day;
initial capital is `initial_capital` CHF.
"""
from __future__ import annotations
import os
from dataclasses import dataclass
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
SPLIT_DATE = "2014-12-31"  # in-sample <= this date, out-of-sample after


def _fname(t: str) -> str:
    return t.replace("=X", "").replace("^", "").replace("-", "_") + ".csv"


def load_prices(ticker: str, data_dir: str = DATA_DIR) -> pd.DataFrame:
    """Return DataFrame[Open, High, Low, Close, Volume] indexed by date."""
    df = pd.read_csv(os.path.join(data_dir, _fname(ticker)), index_col=0, parse_dates=True)
    return df.sort_index()


@dataclass
class Result:
    equity: pd.Series        # CHF equity curve
    equity_usd: pd.Series
    weights: pd.DataFrame    # executed weights (held during each day)
    n_trades: int
    exposure: float          # mean fraction of equity invested


def _to_weights(signal, prices) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Normalise inputs into (prices_df_by_asset dict-> Open/Close frames, weights)."""
    if isinstance(prices, pd.DataFrame) and "Close" in prices.columns:  # single asset
        opens = prices[["Open"]].rename(columns={"Open": "asset"})
        closes = prices[["Close"]].rename(columns={"Close": "asset"})
        if isinstance(signal, pd.DataFrame):
            signal = signal.iloc[:, 0]
        w = pd.DataFrame({"asset": pd.Series(signal).astype(float)})
    else:  # dict {name: ohlcv df}
        names = list(prices)
        opens = pd.concat({n: prices[n]["Open"] for n in names}, axis=1)
        closes = pd.concat({n: prices[n]["Close"] for n in names}, axis=1)
        w = pd.DataFrame(signal).astype(float)[names]
    idx = opens.index.intersection(closes.index)
    opens, closes = opens.loc[idx], closes.loc[idx]
    ok = opens.notna().all(axis=1) & closes.notna().all(axis=1)
    opens, closes = opens[ok], closes[ok]
    w = w.reindex(closes.index).ffill().fillna(0.0)
    if (w < -1e-12).any().any() or (w.sum(axis=1) > 1 + 1e-9).any():
        raise ValueError("weights must be long-only with sum <= 1 (no leverage)")
    return opens, closes, w


def backtest(signal, prices, initial_capital: float = 1000.0, fee: float = 0.001,
             slippage: float = 0.0005, fx: pd.Series | None = None) -> Result:
    """Run a backtest.

    signal: Series (0/1 or fraction) for single asset, or DataFrame of weights
            (columns = asset names) for multi-asset. Row t is known at close t.
    prices: single-asset OHLCV DataFrame, or dict {name: OHLCV DataFrame}.
    fx:     USDCHF close series (default: load_prices('USDCHF=X').Close);
            pass a constant/ones series to stay in USD.
    """
    opens, closes, w = _to_weights(signal, prices)
    w_exec = w.shift(1).fillna(0.0)  # decided at t-1 close, executed t open
    if fx is None:
        fx = load_prices("USDCHF=X")["Close"]
    fx = fx.reindex(closes.index.union(fx.index)).ffill().reindex(closes.index)
    if fx.isna().any():
        fx = fx.bfill()
    cost = fee + slippage
    O, C, W = opens.values, closes.values, w_exec.values
    n, k = C.shape
    E = initial_capital / fx.iloc[0]  # USD
    v = np.zeros(k)          # USD value held per asset
    cash = E                 # USD cash (earns 0)
    eq = np.empty(n); held = np.zeros((n, k)); trades = 0
    prev_c = None
    for i in range(n):
        if prev_c is not None:
            v = v * (O[i] / prev_c)                 # overnight move on held positions
        E = cash + v.sum()
        target = W[i] * E                           # rebalance at the open
        traded = np.abs(target - v)
        trades += int((traded > 1e-9 * max(E, 1.0)).sum())
        E -= traded.sum() * cost                    # fee + slippage on traded notional
        v = W[i] * E
        cash = E - v.sum()
        held[i] = W[i]
        v = v * (C[i] / O[i])                       # intraday move
        eq[i] = cash + v.sum()
        prev_c = C[i]
    eq_usd = pd.Series(eq, index=closes.index, name="equity_usd")
    eq_chf = (eq_usd * fx).rename("equity_chf")
    return Result(eq_chf, eq_usd, pd.DataFrame(held, index=closes.index, columns=w.columns),
                  trades, float(held.sum(axis=1).mean()))


def metrics(res, periods_per_year: int = 252) -> dict:
    """Metrics from a Result (or a bare equity Series; trades/exposure then NaN).
    periods_per_year: 252 for equities, 365 for 24/7 assets like BTC."""
    eq = res.equity if isinstance(res, Result) else res
    r = eq.pct_change().dropna()
    years = (eq.index[-1] - eq.index[0]).days / 365.25
    total = eq.iloc[-1] / eq.iloc[0] - 1
    return {
        "final_value_chf": float(eq.iloc[-1]),
        "total_return": float(total),
        "cagr": float((eq.iloc[-1] / eq.iloc[0]) ** (1 / years) - 1) if years > 0 else np.nan,
        "max_drawdown": float((eq / eq.cummax() - 1).min()),
        "sharpe": float(r.mean() / r.std() * np.sqrt(periods_per_year)) if r.std() > 0 else np.nan,
        "n_trades": res.n_trades if isinstance(res, Result) else np.nan,
        "exposure": res.exposure if isinstance(res, Result) else np.nan,
    }


def split(df, split_date: str = SPLIT_DATE):
    """(in_sample <= 2014-12-31, out_of_sample 2015-01-01..latest)."""
    d = pd.Timestamp(split_date)
    return df[df.index <= d], df[df.index > d]
