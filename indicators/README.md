# Institutional Fib Confluence — NQ / ES / GC

A TradingView Pine Script (v6) indicator that combines Fibonacci retracement,
multi-factor technical analysis, and cross-market correlation into a single
confluence score. It only prints a trade "call" when enough independent
signals line up — the way a discretionary desk would stack confirmations
before sizing into a position, not on any single signal alone.

File: [`institutional-fib-confluence.pine`](./institutional-fib-confluence.pine)

## How it decides to call a trade

For every bar it evaluates up to 6 factors per direction:

1. **Trend** — fast EMA vs. slow EMA
2. **Fibonacci zone** — price pulled back into the 38.2%–78.6% retracement
   zone of the last `swingLen` bars and printed a reversal bar
3. **RSI momentum turn**
4. **MACD momentum turn**
5. **Volume** above its moving average (participation)
6. **Cross-market correlation** — the other two futures confirming the
   same market regime (see below)

Trend and the Fib zone are prerequisites for a setup to exist at all, so the
default `minConfluence = 3` always means the base pattern *plus* at least one
independent confirmation. Raise it to 4–6 for a stricter, lower-frequency,
higher-conviction filter.

### Cross-market correlation logic

The script pulls the other two symbols via `request.security` (confirmed
bars only, no lookahead) regardless of which chart it's on:

- **NQ vs. ES**: the other index trending the same direction validates the
  move isn't isolated to one instrument.
- **Equities vs. GC**: a clean risk-on rally shouldn't be accompanied by an
  aggressive gold bid; a clean risk-off breakdown is validated by gold being
  bid (flight to safety). When the chart itself is GC, the logic is
  inverted — gold up is confirmed by both equity indices being weak, and
  vice versa.

This is a heuristic regime read, not a statistical guarantee — correlations
between these instruments shift with the macro backdrop (rate regime, USD
strength, etc.), so treat it as one input, not gospel.

## Output

- Fibonacci levels plotted on the chart
- A status table (top-right) showing live trend/RSI/MACD/volume/correlation
  readings and the current confluence score out of 6
- Labeled call boxes when a signal fires, e.g.:

  ```
  INSTITUTIONAL LONG — NQ
  Confluence 4/6: Trend, Fib 61.8%, MACD Turn, Cross-Market
  Entry 18420.25 | Stop 18355.00 | Target 18610.00 | Stretch 18463.00
  R:R 2.9
  ```

  Stop = beyond the fib zone/swing extreme, buffered by ATR. Target = the
  opposing swing extreme. Stretch = a 27.2% Fibonacci extension beyond it.
- Two `alertcondition()`s ("Institutional Long Call" / "Institutional Short
  Call") so you can wire TradingView alerts to email/webhook/app push.

## Setup on TradingView

1. Open TradingView → Pine Editor → **New indicator** → paste in the
   contents of `institutional-fib-confluence.pine` → **Add to chart**.
2. Add it to a chart on `CME_MINI:NQ1!` (NQ), `CME_MINI:ES1!` (ES), or
   `COMEX:GC1!` (GC). It auto-detects which one it's on via `syminfo.root`
   and adjusts the correlation logic accordingly. Repeat per-symbol — Pine
   indicators run per chart, so you'll want one instance on each of the
   three charts to watch all of them at once.
3. In the indicator's settings, confirm the **ES / NQ / GC Symbol** inputs
   under "Cross-Market Correlation" point at the contracts/months you
   actually trade (continuous contracts `NQ1!`/`ES1!`/`GC1!` are the
   defaults).
4. Right-click the chart → **Add Alert** → Condition: this indicator →
   choose "Institutional Long Call" or "Institutional Short Call" →
   set your notification method (popup/email/webhook/app).
5. Tune `Minimum Confluences Required`, the swing lookback, and the ATR
   stop multiplier to match the instrument's typical range and your risk
   tolerance — defaults are a reasonable starting point, not a fitted
   backtest result.

## Notes and limitations

- The Fibonacci swing is a rolling N-bar high/low, not a true ZigZag pivot —
  simple and robust, but it will redraw as the rolling window moves. Treat
  the plotted levels as "current context," not a fixed historical anchor.
- This is a signal/confluence engine, not a backtested strategy. It doesn't
  size positions, manage open trades, or account for slippage/commissions.
  Validate on the TradingView **Strategy Tester** (or paper trade) on your
  specific contracts and timeframe before risking capital.
- Cross-market correlations are regime-dependent and can invert; the
  correlation factor is one input among six, not a standalone signal.
- Educational/informational tool only — not financial advice.
