const LESSONS = [
  {
    title: 'What is order flow?',
    body: `
      <p>Order flow trading looks at real-time buying and selling pressure &mdash;
      who is aggressively hitting the bid or lifting the offer &mdash; instead of
      only price and lagging indicators. It sits underneath a normal price chart,
      at the level of individual executed trades.</p>
      <p>It doesn't replace technical analysis. It's a second lens: TA tells you
      <em>where</em> to look, order flow helps confirm <em>what's actually
      happening</em> when price gets there.</p>
    `,
  },
  {
    title: 'Bid, ask, and the tape',
    body: `
      <ul>
        <li><strong>Bid</strong> &mdash; the highest price a buyer is currently willing to pay (a resting, passive order).</li>
        <li><strong>Ask / Offer</strong> &mdash; the lowest price a seller is currently willing to accept (also passive).</li>
        <li>A trade that prints at the <span class="tag-buy">ask</span> means a buyer paid up to get filled &mdash; an <em>aggressive buy</em>.</li>
        <li>A trade that prints at the <span class="tag-sell">bid</span> means a seller hit the resting bid &mdash; an <em>aggressive sell</em>.</li>
        <li><strong>Time &amp; Sales</strong> (the "tape") is the scrolling list of every executed trade: price, size, and side.</li>
      </ul>
    `,
  },
  {
    title: 'The footprint chart',
    body: `
      <p>A footprint chart splits a single candle into its price levels and shows
      how much volume traded at the <span class="tag-buy">ask</span> vs the
      <span class="tag-sell">bid</span> at each level, instead of collapsing it
      into one open/high/low/close.</p>
      <p><strong>Delta</strong> = ask volume &minus; bid volume at a level (or
      summed for the whole candle). Positive delta means net aggressive buying at
      that price; negative means net aggressive selling.</p>
    `,
  },
  {
    title: 'Imbalance & stacked imbalances',
    body: `
      <p>An <strong>imbalance</strong> flags a price level where one side heavily
      outweighs the other &mdash; commonly when one side is <code>&ge; 300%</code>
      of the other.</p>
      <p>A single imbalanced level is weak evidence on its own. <strong>Stacked
      imbalances</strong> &mdash; three or more consecutive price levels
      imbalanced in the same direction &mdash; are a much stronger signal:</p>
      <ul>
        <li>Stacked <span class="tag-buy">buy</span> imbalances near the bottom of a pullback often precede upside continuation &mdash; buyers kept being aggressive even as price dipped.</li>
        <li>Stacked <span class="tag-sell">sell</span> imbalances near the top of a rally often precede downside continuation.</li>
      </ul>
    `,
  },
  {
    title: 'Absorption & exhaustion',
    body: `
      <p><strong>Absorption</strong>: a large burst of aggressive market orders
      hits a level, but price fails to move any further &mdash; resting limit
      orders "absorbed" all that aggression. Watch for it at the extremes:</p>
      <ul>
        <li>Big <span class="tag-buy">buy</span> volume absorbed at the <em>high</em> of a candle with no follow-through &rarr; possible bearish reversal (someone was selling into all that buying).</li>
        <li>Big <span class="tag-sell">sell</span> volume absorbed at the <em>low</em> of a candle with no breakdown &rarr; possible bullish reversal.</li>
      </ul>
      <p><strong>Exhaustion</strong> is the mirror idea over time: aggressive
      volume drying up after a strong directional move warns that the move may be
      running out of participants to sustain it.</p>
    `,
  },
  {
    title: 'Volume profile basics',
    body: `
      <p>A volume profile plots traded volume by <em>price</em> instead of by
      time, drawn as a horizontal histogram next to the chart.</p>
      <ul>
        <li><strong>POC (Point of Control)</strong> &mdash; the single price level with the most volume traded.</li>
        <li><strong>Value Area (VAH / VAL)</strong> &mdash; the price range containing roughly 70% of the session's volume, bounded by the Value Area High and Value Area Low.</li>
        <li><strong>HVN / LVN</strong> &mdash; High/Low Volume Nodes. HVNs often act like magnets and support/resistance; price tends to move quickly through LVNs since few participants transacted there.</li>
      </ul>
    `,
  },
  {
    title: 'Reading the tape',
    body: `
      <p>Watch the <em>size</em> and <em>speed</em> of prints, not just their
      direction:</p>
      <ul>
        <li>Large prints repeatedly hitting one side suggest a committed, aggressive participant (or algo).</li>
        <li>Print sizes thinning out after a run is often the first sign that pressure is weakening &mdash; a possible early exhaustion tell.</li>
        <li>A sudden burst of much larger prints than the recent average is worth noticing, win or lose &mdash; it's new information entering the market.</li>
      </ul>
    `,
  },
  {
    title: 'Combining order flow with classic TA',
    body: `
      <p>Order flow works best as <em>confirmation</em> at levels technical
      analysis already flagged as important: support/resistance, trendlines, and
      recognizable chart patterns.</p>
      <p>Example: seeing buy-side absorption right at a prior support level is a
      much stronger bullish tell than either tool would give you alone &mdash;
      the level mattered structurally, <em>and</em> the order flow shows real
      buyers defending it.</p>
    `,
  },
  {
    title: 'Chart patterns, quick reference',
    body: `
      <ul>
        <li><strong>Double top / bottom</strong> &mdash; price tests a level twice and fails to break it; often a reversal.</li>
        <li><strong>Head &amp; shoulders (or inverse)</strong> &mdash; three swings, the middle one furthest extended; a classic reversal pattern.</li>
        <li><strong>Flags</strong> &mdash; a sharp move (the pole) followed by a tight, opposite-sloping consolidation, usually resolving as a continuation.</li>
        <li><strong>Triangles (ascending / descending)</strong> &mdash; a flat side repeatedly tested against a sloping side, compressing until it breaks.</li>
      </ul>
      <p>Practice spotting these in the <strong>Chart Patterns</strong> drill.</p>
    `,
  },
];

export function renderLessons(container) {
  container.innerHTML = LESSONS.map(
    (lesson, i) => `
      <details ${i === 0 ? 'open' : ''}>
        <summary>${lesson.title}</summary>
        <div class="lesson-body">${lesson.body}</div>
      </details>
    `
  ).join('');
}
