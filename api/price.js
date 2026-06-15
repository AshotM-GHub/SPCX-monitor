export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPCX?interval=1m&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    res.json({
      price: meta.regularMarketPrice,
      open: meta.regularMarketOpen,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      prevClose: meta.previousClose,
      afterHours: meta.postMarketPrice || null
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
