# Institutional Fib Confluence — NQ / ES / GC

A TradingView Pine Script (v6) indicator that replicates a break-of-structure
Fibonacci retracement — anchored off the swing point that was just broken,
not a generic rolling high/low — combined with multi-factor TA, a
higher-timeframe bias filter, liquidity sweep detection, and cross-market
correlation into a single confluence score. It only prints a trade "call"
when enough independent signals line up, the way a discretionary desk
stacks confirmations before sizing into a position.

File: [`institutional-fib-confluence.pine`](./institutional-fib-confluence.pine)

## The Fib model (matches your manual template)

Anchors:
- **Anchor 0 — "Entry Zone"**: the swing pivot that was just broken (the
  break-of-structure point). Detected automatically from pivot highs/lows
  (`Swing Pivot Lookback` bars each side) — when price crosses back over a
  confirmed swing high that formed after the last swing low, that's a
  bullish BOS (mirrored for bearish).
- **Anchor 1 — "Origin"**: the opposite swing that started the impulse leg
  leading into the break. Unlabeled on the chart, but it's what the ratios
  are measured against.

Named levels (ratio → meaning, matching your color scheme):

| Ratio | Zone | Color | Meaning |
|---|---|---|---|
| 0.382 / 0.5 | Confluence Zone | yellow box | Primary pullback area — look for a reversal pattern here to enter back in the direction of the break |
| 0.786 | Breakout Pattern | orange | Deep zone; a close through it invalidates the break (structure reset) |
| 0 | Entry Zone | grey | The BOS pivot itself — a shallower retest entry |
| -0.27 | Take Profit 1 | light blue | First staged target beyond the Entry Zone |
| -0.618 | Take Profit 2 | blue | Second staged target |
| -1.272 | Alpha | purple | Final target — the expected end of the breakout move |

For a bearish break everything mirrors exactly as you described: Entry Zone
sits at the broken swing low, TP1/TP2/Alpha extend below it, and
Confluence/Breakout Pattern sit above it.

All six ratios are exposed as inputs (`Fib Ratios (your template)` group) in
case you tune them per instrument — defaults are your exact values
(0.382, 0.5, 0.786, -0.27, -0.618, -1.272). The Confluence Zone is now drawn
as a shaded box (extends right automatically) instead of two bare lines, so
it reads as a band the way you actually draw it.

## How a call fires

1. Price must be in a pullback zone: inside the Confluence Zone box, or
   retesting the Entry Zone (within an ATR-scaled tolerance).
2. That bar must close as a reversal bar in the direction of the break.
3. The Breakout Pattern level must not have been violated (that would mean
   the structure already failed).
4. If **HTF Trend Alignment** is required (on by default), the higher
   timeframe (240m/4H by default, configurable) EMA trend must agree with
   the break direction — this is the single biggest filter for cutting out
   counter-trend lower-timeframe noise.
5. If a **Session Filter** is enabled, the bar must fall inside the
   configured session window (default 09:30–16:00 America/New_York).
6. If **Require Trending Regime** is enabled (off by default, under `Trend
   Strength (ADX/DMI)`), ADX must be at or above the threshold — a way to
   suppress signals in a choppy, directionless tape without touching the
   /5 scoring below.
7. At least `minConfluence` (default 3, out of 5) of the following must also
   agree: being specifically in the Confluence Zone (vs. only the shallower
   Entry Zone), a Momentum turn (RSI turning up/down from a soft area, or a
   MACD histogram turn — either counts, so this is one factor, not two),
   **Volume** (see below — a composite, not just "above average"),
   Cross-Market correlation, and a **Liquidity Sweep** — a wick that takes
   out the recent range extreme (stop hunt) and reclaims it same bar, a
   stronger tell than a plain reversal candle on its own.

The status table shows this live, even before a call fires — a "Confluence"
row like `2/5 — Confluence Zone, Volume` tells you exactly what's present
and what's still missing, not just a bare score.

### Volume analysis

The "Volume" factor isn't just volume vs. its average — it's three real
measures that all have to agree with the trade direction:

- **Relative Volume (RVOL)** — current volume divided by its own average;
  must clear a threshold (default 1.2x) so the bar actually has above-
  normal participation, not just marginally more than average.
- **On-Balance Volume (OBV)**, read against its own EMA — confirms the
  cumulative volume flow is trending the same direction as the trade, not
  just that this one bar was busy.
- **Chaikin Money Flow (CMF)** — net buying vs. selling pressure over the
  same lookback window, using each bar's close position within its range
  weighted by volume; positive for a long, negative for a short.

All three must agree, so "Volume" firing means real, sustained participation
in the right direction — not one loud bar. The status table's Volume row
shows the raw readings (e.g. `RVOL 1.4x | OBV ↑ | CMF +0.18`) so you can see
which of the three is or isn't lining up, even when the factor doesn't fire.

Two more TA reads are shown for context but don't gate the score:
- **VWAP** (session-anchored) is plotted on the chart and shown in the table
  as price's distance above/below it — a level institutional flow watches
  closely for mean-reversion vs. trend-continuation reads.
- **ADX/DMI** trend strength is shown in the table regardless of whether the
  "Require Trending Regime" filter is on, so you can see the choppy/trending
  read even when you're not gating on it.

### Cross-market correlation

Pulls the other two futures via `request.security` (confirmed bars, no
lookahead) regardless of which chart it's on:

- **NQ vs. ES**: the other index trending the same direction validates the
  move isn't isolated to one instrument.
- **Equities vs. GC**: a clean risk-on rally shouldn't be accompanied by an
  aggressive gold bid; a clean risk-off breakdown is validated by gold
  being bid (flight to safety). On a GC chart the read is inverted — gold
  up is confirmed by both equity indices being weak, and vice versa.

The confluence factor itself is still this regime-agreement boolean, but
the status table also shows the real `ta.correlation()` coefficient against
both other symbols for transparency (e.g. "ES 0.71 / GC -0.35") — a useful
sanity check on whether the assumed regime actually holds right now.

This is a regime heuristic, not a statistical guarantee — treat it as one
input among five, not a standalone signal.

## Output

Kept deliberately lean — one clear reason for the call, one stop, one set
of targets, not a wall of raw indicator values.

- The five single-price levels plotted as lines (Entry Zone, Breakout
  Pattern, TP1, TP2, Alpha), the Confluence Zone as a shaded box, and a
  dedicated **Stop Loss** line once a bias is active (beyond the Breakout
  Pattern level, buffered by ATR)
- A 9-row status table (top-right): Bias (symbol + BOS direction + whether
  HTF agrees), Zone, Confluence (score out of 5 *and* which factors are
  present, live, not just at signal time), Stop, R:R to TP1/TP2/Alpha,
  Volume (RVOL/OBV/CMF), VWAP position, ADX trend strength, and the
  cross-market correlation coefficients
- A labeled call box when a signal fires, e.g.:

  ```
  LONG — NQ (4/5)
  Why: Confluence Zone, Volume, Cross-Market, Liquidity Sweep
  Entry 18420.25 | Stop 18355.00
  TP1 18475.00 (R 0.8) | TP2 18610.00 (R 2.9) | Alpha 18720.00 (R 4.6)
  ```

  The R:R column is meant to be read as a staircase — TP1 is usually close
  to 1:1, and Alpha stretches out toward 1:3+ depending on how wide the
  actual swing was; it's computed live from your ATR-buffered stop, not
  forced to hit exact ratios.
- Two alert mechanisms:
  - `alertcondition()` entries ("Institutional Long Call", "Institutional
    Short Call", "Structure Invalidated") — pick one directly in the
    Create Alert dialog for a fixed, simple message.
  - `alert()` calls fired at the same moments with the **full dynamic
    message** shown above (real entry/stop/TP/Alpha numbers and the "Why",
    not just `{{close}}`) — select "Any alert() function call" as the
    condition to get this richer notification.

## Setup on TradingView

1. Pine Editor → **New indicator** → paste in the file contents → **Add to
   chart**.
2. Add it to `CME_MINI:NQ1!`, `CME_MINI:ES1!`, and `COMEX:GC1!` charts
   separately (Pine runs per chart) — it auto-detects which one it's on via
   `syminfo.root` and adjusts the correlation read accordingly.
3. Confirm the ES/NQ/GC symbol inputs under "Cross-Market Correlation"
   point at the contracts you actually trade.
4. Right-click chart → **Add Alert** → Condition: this indicator → pick a
   named condition, or "Any alert() function call" for the rich message →
   set notification method.
5. Tune `Swing Pivot Lookback` to match how far back a "swing" should look
   on your timeframe, and `Higher Timeframe` to whatever you use for bias
   (defaults to 240m/4H — set it to Daily if you trade off a daily read).

## Notes and limitations

- Swing pivots confirm `pivotLen` bars after they occur (standard for any
  pivot-based structure detection) — very recent swings aren't known
  immediately, only once enough bars have passed on the right side.
- The HTF bias read uses `request.security` with `lookahead_off`; it's
  standard practice for multi-timeframe confirmation but can still shift
  intrabar on the HTF's currently-forming bar. Final calls are gated on
  `barstate.isconfirmed` on the chart's own timeframe to reduce this.
- The liquidity sweep check is a simplified range-break-and-reclaim
  approximation, not real bid/ask order flow — see the order flow
  discussion below.
- This is a signal/confluence engine, not a backtested strategy — it
  doesn't size positions or manage open trades. Validate on the TradingView
  Strategy Tester or paper trade before risking capital.
- Cross-market correlations are regime-dependent and can invert.
- **No order flow.** Everything here — including RVOL, OBV, and CMF — comes
  from OHLCV bars, not the actual tape. There's still no bid/ask imbalance,
  real delta, or footprint/DOM data; CMF's "buying/selling pressure" is an
  approximation from where each bar closes within its range, not executed
  order flow. Treat true order-flow reading (footprint/DOM) as a separate,
  manual step alongside this indicator.
- Educational/informational tool only — not financial advice.
