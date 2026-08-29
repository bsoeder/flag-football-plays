"""Investment screener: a free-data prototype for scoring private-company raises.

The pipeline turns SEC Form D filings into a labelled dataset and backtests
whether cheap signals from a company's *first* raise predict whether it goes on
to raise a larger follow-on round -- a proxy for early traction that an angel or
seed investor cares about.

All modules operate on three tables whose schema mirrors the SEC Form D
structured Data Sets (FORMDSUBMISSION / ISSUERS / OFFERING). The same feature,
label and backtest code runs whether those tables come from live SEC downloads
(`screener.edgar`) or the calibrated offline simulator (`screener.simulate`).
"""

__all__ = ["edgar", "simulate", "features", "labels", "backtest"]
