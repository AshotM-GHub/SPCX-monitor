export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // Fetch both live quote and summary stats in parallel
    const [chartRes, summaryRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPCX?interval=1m&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }),
      fetch('https://query2.finance.yahoo.com/v10/finance/quoteSummary/SPCX?modules=summaryDetail,defaultKeyStatistics,financialData', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
    ]);

    const chartData = await chartRes.json();
    const summaryData = await summaryRes.json();

    const meta = chartData?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('No chart data');

    const detail = summaryData?.quoteSummary?.result?.[0]?.summaryDetail || {};
    const keyStats = summaryData?.quoteSummary?.result?.[0]?.defaultKeyStatistics || {};
    const financial = summaryData?.quoteSummary?.result?.[0]?.financialData || {};

    const fmt = (v) => v?.raw ?? null;

    res.json({
      // Live price data
      price:        meta.regularMarketPrice,
      open:         meta.regularMarketOpen,
      high:         meta.regularMarketDayHigh,
      low:          meta.regularMarketDayLow,
      volume:       meta.regularMarketVolume,
      prevClose:    meta.previousClose,
      afterHours:   meta.postMarketPrice || null,

      // Summary stats
      mktCap:       fmt(detail.marketCap),
      fiftyTwoHigh: fmt(detail.fiftyTwoWeekHigh),
      fiftyTwoLow:  fmt(detail.fiftyTwoWeekLow),
      avgVolume:    fmt(detail.averageVolume),
      pe:           fmt(detail.trailingPE),
      yield:        fmt(detail.dividendYield),
      beta:         fmt(detail.beta),
      eps:          fmt(keyStats.trailingEps),
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
