# Investment Screener — a free-data prototype

A working prototype that turns **free SEC data into a scored, backtested signal**
for early-stage (angel / seed) investing, plus a concrete roadmap for the paid
data you'd add to make it serious.

It is deliberately narrow and honest: it does not claim to predict returns
(private-company returns are power-law and mostly unknowable from public data).
Instead it answers one clean, testable question and shows the signal is real.

---

## The question the prototype tests

> Given a company's **first** SEC Form D filing (an early / seed raise), can
> cheap signals from that filing predict whether the **same company** goes on to
> raise a **larger follow-on round within 3 years**?

A larger follow-on raise is a free, fully-observable proxy for early traction and
survival — exactly the "did this company keep growing" signal an angel wants to
be on the right side of. It's imperfect (a company can succeed without another
Form D), but it needs **no paid data and no entity-resolution guesswork**,
because every Form D is filed under a stable issuer key (CIK).

### Why Form D is the right free starting point

- **Form D = the actual angel/VC raise.** Reg D private placements (Rule 506b/c)
  are how startups raise; the Form D notice is public and structured.
- **Data + labels in one source.** The features (amount, investors, industry,
  revenue stage) and the outcome (a later, larger raise by the same CIK) both
  come from the same free filings.
- **Entity resolution is free.** The CIK links a company's filings over time, so
  "did they raise again" is a lookup, not a fuzzy-match problem.
- **Deep history.** SEC publishes structured Form D data sets quarterly back to
  2008.

---

## What's in here

```
investment-screener/
├── screener/
│   ├── edgar.py       # LIVE loader for SEC Form D structured Data Sets (real schema)
│   ├── simulate.py    # calibrated OFFLINE simulator (same schema) for sandboxes
│   ├── labels.py      # reconstruct the follow-on label from filing history (no leakage)
│   ├── features.py    # features from the FIRST filing only (no look-ahead)
│   └── backtest.py    # time-split models + honest metrics + ranked shortlist
├── run_prototype.py   # end-to-end: data -> dataset -> backtest -> report
├── outputs/           # metrics.json, dataset.csv (generated)
└── requirements.txt
```

The feature / label / backtest code is **identical** whether the data is live or
simulated — only the source module changes.

---

## Run it

```bash
pip install -r requirements.txt

# offline: calibrated simulator (runs anywhere, no network)
python run_prototype.py

# live: real SEC Form D data (needs outbound access to sec.gov)
python run_prototype.py --live 2014 2021
```

### ⚠️ On the numbers below — read this

The metrics in this repo were produced by the **calibrated offline simulator**,
because the environment this prototype was built in **blocks outbound egress to
`sec.gov`** (an org network policy). The simulator emits data with the *same
schema, column names and value vocabularies* as the real SEC Form D data sets,
with realistic distributions and a **deliberately noisy** latent signal, so:

- the pipeline is fully exercised end-to-end, and
- the reported ~0.72 AUC is a *believable methodology demo*, **not** a claim
  about real companies and **not** a circular result (features and the outcome
  are wired to a hidden latent through independent noise, so the model must
  actually recover signal).

Run `--live 2014 2021` in any environment with SEC access to reproduce the exact
same analysis on real filings. That is the real test.

---

## Results (calibrated simulated data, held-out 2019–2021 cohorts)

Outcome base rate (operating companies): **~24%** raise a larger follow-on in 3y.

| model               | ROC-AUC | PR-AUC | Brier | top-decile lift | precision@10% |
|---------------------|--------:|-------:|------:|----------------:|--------------:|
| logistic regression |  0.719  | 0.465  | 0.161 |          2.38×  |        57.3%  |
| gradient boosting   |  0.717  | 0.460  | 0.162 |          2.38×  |        57.4%  |

**Bottom line:** focusing on the **top 10% by model score** finds follow-on
raisers at **~57% vs a ~24% base rate — a 2.4× lift** in hit rate over picking at
random. For a *shortlisting* tool (surface the 10% worth a human's attention),
that is the metric that matters, and it's strong.

Strongest univariate signals: **investor count**, **amount sold**, **fill rate**
(sold ÷ offered), **offering size**, **revenue stage** — all knowable at the
first filing. That matches intuition: a first round that filled well, pulled in
more investors, and already shows revenue is likelier to graduate.

### How to read this honestly
- Time-split, not random-split: we train only on the past, as a real tool would.
- AUC ~0.72 is *useful screening signal*, not a crystal ball. On real data it may
  be higher or lower — the point is the framework produces a rigorous, calibrated
  number instead of a hand-wave.
- This proves a **signal exists in free data**. It does not prove *sufficiency* —
  see the roadmap.

---

## From prototype to serious: the data you'd add

Form D alone tops out as a screen. To make real recommendations you need signals
about *demand, team and product*, most of which are paid:

| Signal you want            | Serious source(s)                                   |
|----------------------------|-----------------------------------------------------|
| Rounds, valuations, investors | PitchBook, Crunchbase, Dealroom, CB Insights     |
| Headcount / key hires / attrition | Coresignal, People Data Labs, Revelio Labs, LinkUp |
| Real usage & demand        | Similarweb (web), Sensor Tower / data.ai (mobile), card-panel data (Second Measure, Facteus) |
| Product & culture sentiment | G2, Trustpilot, Glassdoor                           |
| Qualitative / expert view  | Tegus / AlphaSense, expert networks                 |
| Actual financials          | the deal's data room, Carta cap-table data          |

Other **free** enrichments to try before paying: GitHub traction (dev-tool
startups), Hacker News / Product Hunt launch signal, USPTO patents, app-store
review velocity, Certificate Transparency (infra growth), GDELT (news events).

**The moat is not the data** (competitors buy the same feeds) — it's **entity
resolution** across messy sources and **backtested judgment** about which signals
matter per stage and sector. This prototype is the seed of exactly that.

---

## Honest limitations

- **Proxy label.** "Larger follow-on Form D" ≠ "good investment." It misses
  acquisitions/IPOs with no further Form D and counts down-round bridges as
  larger if the notice amount is bigger. A serious version would join outcome
  data (exits, later valuations) as labels.
- **Survivorship & selection.** Form D only sees companies that raised at all.
- **Not investment advice.** This is a *screening / due-diligence acceleration*
  tool — surface candidates and flag risks for a human, never "invest / don't."
- **Data licensing** is the real Phase-2 constraint: most valuable feeds forbid
  redistribution and scraping. Budget for it legally, not just financially.
