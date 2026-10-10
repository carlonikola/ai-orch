"""Download daily OHLCV to trading/data/*.csv (yfinance, stooq fallback)."""
import io, os, sys
import pandas as pd, requests

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
TICKERS = ["SPY", "QQQ", "TLT", "GLD", "BTC-USD", "USDCHF=X", "EWL", "^SSMI"]
START = {"BTC-USD": "2014-09-01"}

def fname(t):
    return t.replace("=X", "").replace("^", "").replace("-", "_") + ".csv"

def yf_dl(t):
    import yfinance as yf
    df = yf.download(t, start=START.get(t, "2000-01-01"), auto_adjust=True, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df[["Open", "High", "Low", "Close", "Volume"]].dropna(subset=["Close"])

def stooq_dl(t):
    s = {"SPY": "spy.us", "QQQ": "qqq.us", "TLT": "tlt.us", "GLD": "gld.us", "EWL": "ewl.us",
         "BTC-USD": "btc.v", "USDCHF=X": "usdchf", "^SSMI": "^smi"}[t]
    r = requests.get(f"https://stooq.com/q/d/l/?s={s}&i=d", timeout=30)
    r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text), index_col=0, parse_dates=True)
    df.columns = [c.title() for c in df.columns]
    return df

if __name__ == "__main__":
    os.makedirs(DATA, exist_ok=True)
    for t in TICKERS:
        df = None
        for fn in (yf_dl, stooq_dl):
            try:
                df = fn(t)
                if len(df): break
            except Exception as e:
                print(t, fn.__name__, "failed:", repr(e)[:100])
        if df is None or not len(df):
            print("FAILED", t); continue
        df.index.name = "Date"
        df.index = pd.to_datetime(df.index).tz_localize(None)
        df.sort_index().to_csv(os.path.join(DATA, fname(t)))
        print(t, fname(t), df.index[0].date(), df.index[-1].date(), len(df))
