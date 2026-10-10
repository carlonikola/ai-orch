import numpy as np, pandas as pd, pytest
from engine import backtest, metrics, split, Result

def synth(n=300, seed=0):
    rng = np.random.default_rng(seed)
    idx = pd.bdate_range("2020-01-01", periods=n)
    c = 100 * np.exp(np.cumsum(rng.normal(0.0004, 0.01, n)))
    o = np.r_[c[0], c[:-1]] * (1 + rng.normal(0, 0.003, n))
    return pd.DataFrame({"Open": o, "High": np.maximum(o, c), "Low": np.minimum(o, c),
                         "Close": c, "Volume": 1.0}, index=idx)

def ones(df): return pd.Series(1.0, index=df.index)

def test_buy_and_hold_matches_price_return_minus_one_fee():
    p = synth(); fee, slip = 0.001, 0.0005
    res = backtest(pd.Series(1.0, index=p.index), p, 1000, fee, slip, fx=ones(p))
    expected = 1000 * (p.Close.iloc[-1] / p.Open.iloc[1]) * (1 - fee - slip)  # signal day0 close -> fill day1 open
    assert res.equity.iloc[-1] == pytest.approx(expected, rel=1e-9)
    assert res.n_trades == 1

def test_signal_cannot_see_future():
    p = synth()
    p['Open'] = p.Close.shift(1).fillna(p.Open)  # gap-free so the manual calc is exact
    # row t holds a flag about day t+1's intraday move; engine must fill it at open t+1,
    # so this "oracle" earns exactly the product of positive intraday returns (alignment proof) ...
    intra = p.Close / p.Open - 1
    oracle = (intra.shift(-1) > 0).astype(float)
    res = backtest(oracle, p, 1000, 0, 0, fx=ones(p))
    n = len(p)
    ret = np.where(oracle.iloc[:n-1].values == 1, 1 + intra.iloc[1:].values, 1.0)
    assert res.equity.iloc[-1] == pytest.approx(1000 * ret.prod(), rel=1e-9)
    # ... and the same flags one day late (no peeking) must be nowhere near it
    late = backtest(oracle.shift(1).fillna(0), p, 1000, 0, 0, fx=ones(p))
    assert late.equity.iloc[-1] < 0.5 * res.equity.iloc[-1]
    assert res.weights.iloc[0, 0] == 0  # first day always flat

def test_flipping_future_does_not_change_past():
    p = synth(); sig = (p.Close > p.Close.rolling(20).mean()).astype(float)
    p2 = p.copy(); p2.iloc[200:, :4] *= 3          # change the future
    sig2 = sig.copy(); sig2.iloc[200:] = 1 - sig2.iloc[200:]
    a = backtest(sig, p, fx=ones(p)).equity; b = backtest(sig2, p2, fx=ones(p)).equity
    assert np.allclose(a.iloc[:200], b.iloc[:200])

def test_multi_asset_and_flat_and_metrics():
    p, q = synth(seed=1), synth(seed=2)
    w = pd.DataFrame({"A": 0.5, "B": 0.5}, index=p.index)
    r = backtest(w, {"A": p, "B": q}, fx=ones(p))
    m = metrics(r); assert m["max_drawdown"] <= 0 and 0 < m["exposure"] <= 1
    flat = backtest(pd.Series(0.0, index=p.index), p, fx=ones(p))
    assert flat.equity.iloc[-1] == pytest.approx(1000) and flat.n_trades == 0

def test_leverage_rejected_and_split():
    p = synth()
    with pytest.raises(ValueError): backtest(pd.Series(2.0, index=p.index), p, fx=ones(p))
    a, b = split(pd.DataFrame({"x": 1}, index=pd.to_datetime(["2014-12-31", "2015-01-01"])))
    assert len(a) == 1 and len(b) == 1
