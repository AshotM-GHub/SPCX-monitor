export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPCX?interval=1d&range=2mo', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    // NYSE trading date = the ET calendar date of each daily bar's timestamp.
    // This is the standard convention every financial data tool uses.
    const days = timestamps.map((ts, i) => ({
      date: etDateKey(new Date(ts * 1000)),
      close: closes[i]
    })).filter(d => d.close !== null && d.close !== undefined);

    // While market is open today, Yahoo's last daily bar can be stale.
    // Patch in the live running price for today's ET trading date.
    if (meta.regularMarketPrice && days.length) {
      const todayKey = etDateKey(new Date());
      const lastDay = days[days.length - 1];
      if (lastDay.date === todayKey) {
        lastDay.close = meta.regularMarketPrice;
      } else if (lastDay.date < todayKey) {
        days.push({ date: todayKey, close: meta.regularMarketPrice });
      }
    }

    res.json({ days });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

// Returns the America/New_York calendar date as 'YYYY-MM-DD' for a given Date object.
function etDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}
