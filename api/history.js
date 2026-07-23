export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const range = req.query.range || '1mo';

  // Map range to Yahoo Finance interval + range params
  const config = {
    '1d':  { interval: '5m',  yRange: '1d'  },
    '1wk': { interval: '1h',  yRange: '5d'  },
    '1mo': { interval: '1d',  yRange: '2mo' },
    'all': { interval: '1d',  yRange: '2mo' },
  };
  const { interval, yRange } = config[range] || config['1mo'];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/SPCX?interval=${interval}&range=${yRange}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    const points = timestamps.map((ts, i) => ({
      ts,   // raw unix timestamp — client formats it
      close: closes[i]
    })).filter(p => p.close !== null && p.close !== undefined);

    // For daily ranges, also return the date string for the trigger tracker
    const days = (range === '1mo' || range === 'all')
      ? points.map(p => ({ date: etDateKey(new Date(p.ts * 1000)), close: p.close }))
      : null;

    // Patch today's live price
    if (meta.regularMarketPrice && points.length) {
      const last = points[points.length - 1];
      last.close = meta.regularMarketPrice;
      if (days) {
        const lastDay = days[days.length - 1];
        const todayKey = etDateKey(new Date());
        if (lastDay.date === todayKey) lastDay.close = meta.regularMarketPrice;
        else days.push({ date: todayKey, close: meta.regularMarketPrice });
      }
    }

    res.json({ points, days });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

function etDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}
