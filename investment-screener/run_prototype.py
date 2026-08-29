#!/usr/bin/env python3
"""End-to-end prototype: SEC Form D -> labelled dataset -> metrics -> shortlist.

    python run_prototype.py                 # offline: calibrated simulator
    python run_prototype.py --live 2014 2021  # live SEC (needs sec.gov egress)

Live mode downloads the SEC Form D structured Data Sets for the given year
range; offline mode generates schema-identical simulated data so the whole
pipeline runs anywhere. The feature / label / backtest code is identical either
way -- only the data source changes.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

from screener import backtest, features, labels
from screener.edgar import EgressBlocked, load_form_d
from screener.simulate import simulate_form_d

OUT = Path(__file__).parent / "outputs"
OUT.mkdir(exist_ok=True)

WINDOW = 3          # follow-on outcome window, years
SPLIT_YEAR = 2019   # train on cohorts before, test on/after


def get_tables(args):
    if args.live:
        start, end = args.live
        try:
            print(f"[data] downloading live SEC Form D {start}-{end} ...")
            return load_form_d(start, end), "live-sec-edgar"
        except EgressBlocked as exc:
            print(f"[data] LIVE FETCH BLOCKED: {exc}\n[data] falling back to simulator.")
    print("[data] generating calibrated OFFLINE simulated Form D data ...")
    return simulate_form_d(n_issuers=40_000, start_year=2014, end_year=2021,
                           outcome_window_years=WINDOW), "offline-simulated"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", nargs=2, type=int, metavar=("START", "END"),
                    help="download live SEC Form D for [START, END]")
    args = ap.parse_args()

    tables, source = get_tables(args)
    print(f"[data] source={source}  submissions={len(tables.submissions):,}  "
          f"issuers={len(tables.issuers):,}  offerings={len(tables.offerings):,}")

    frame = labels.build_frame(tables, window_years=WINDOW)
    feat = features.build_features(frame, tables)
    feat.to_csv(OUT / "dataset.csv", index=False)
    print(f"[dataset] {len(feat):,} issuers with observable {WINDOW}y outcome; "
          f"overall follow-on rate = {feat['followon'].mean():.1%}")

    results, meta, (test, gb) = backtest.run_backtest(feat, SPLIT_YEAR, operating_only=True)
    shortlist = backtest.top_shortlist(test, gb, n=15)

    # ---- assemble report ---------------------------------------------------
    report = {
        "data_source": source,
        "note": ("Metrics are computed on CALIBRATED SIMULATED data because this "
                 "environment blocks egress to sec.gov. Run with --live once "
                 "sec.gov is reachable to reproduce on real filings; the pipeline "
                 "code is identical."),
        "outcome": f"same-CIK larger follow-on Form D within {WINDOW} years",
        "split": {"train_cohorts": meta["train_cohorts"], "test_cohorts": meta["test_cohorts"],
                  "n_train": meta["n_train"], "n_test": meta["n_test"],
                  "base_rate_train": meta["base_rate_train"],
                  "base_rate_test": meta["base_rate_test"]},
        "models": [vars(r) for r in results],
    }
    (OUT / "metrics.json").write_text(json.dumps(report, indent=2))

    # ---- console summary ---------------------------------------------------
    print("\n" + "=" * 70)
    print(f"BACKTEST  (source: {source})")
    print("=" * 70)
    print(f"Outcome: {report['outcome']}")
    print(f"Train cohorts {meta['train_cohorts']}  n={meta['n_train']:,}  "
          f"base rate {meta['base_rate_train']:.1%}")
    print(f"Test  cohorts {meta['test_cohorts']}  n={meta['n_test']:,}  "
          f"base rate {meta['base_rate_test']:.1%}")

    print("\nTop univariate signals (train):")
    print(meta["univariate"].head(8).to_string(index=False))

    print("\nModel performance (held-out test cohorts):")
    hdr = f"{'model':22} {'ROC-AUC':>8} {'PR-AUC':>8} {'Brier':>7} {'top-decile lift':>16} {'prec@10%':>9}"
    print(hdr)
    print("-" * len(hdr))
    for r in results:
        print(f"{r.name:22} {r.auc:>8.3f} {r.avg_precision:>8.3f} {r.brier:>7.3f} "
              f"{r.lift_top_decile:>15.2f}x {r.precision_at_10pct:>9.1%}")

    logit = results[0]
    print("\nLogistic-regression coefficients (direction & strength):")
    for f, c in list(logit.feature_importance.items())[:10]:
        print(f"   {f:26} {c:+.3f}")

    print("\nScreener output -- top 15 companies to look at (held-out cohorts):")
    print("(followon=1 means it really did raise a larger round -- the 'hit' column)")
    print(shortlist.to_string(index=False))

    base = meta["base_rate_test"]
    p10 = results[1].precision_at_10pct
    print("\n" + "=" * 70)
    print(f"BOTTOM LINE: focusing on the top 10% by model score finds follow-on "
          f"raisers\nat {p10:.0%} vs a {base:.0%} base rate "
          f"-- a {p10/base:.1f}x lift in hit rate over picking at random.")
    print("=" * 70)
    print(f"\nWrote {OUT/'metrics.json'} and {OUT/'dataset.csv'}")


if __name__ == "__main__":
    sys.exit(main())
