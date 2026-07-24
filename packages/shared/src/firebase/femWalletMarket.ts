// FEM WALLET — Public Market Data via CoinGecko (free, no API key needed)
// Used as a fallback or supplement alongside OneKey's utility backend.
// OneKey's backend handles the primary market data; this provides
// a direct public fallback when needed.

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export type IFemCoinPrice = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
};

export type IFemSimplePrice = Record<string, Record<string, number>>;

/** Fetch top coins by market cap. */
export async function fetchTopCoins(
  currency = 'usd',
  perPage = 100,
  page = 1,
): Promise<IFemCoinPrice[]> {
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  return res.json() as Promise<IFemCoinPrice[]>;
}

/** Fetch price for specific coin IDs (e.g. 'bitcoin,ethereum'). */
export async function fetchSimplePrice(
  ids: string,
  currencies = 'usd',
): Promise<IFemSimplePrice> {
  const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=${currencies}&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  return res.json() as Promise<IFemSimplePrice>;
}

/** Fetch OHLCV chart data for a coin (days: 1, 7, 14, 30, 90, 180, 365, max). */
export async function fetchCoinChart(
  coinId: string,
  currency = 'usd',
  days: number | 'max' = 7,
): Promise<{ prices: [number, number][] }> {
  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  return res.json() as Promise<{ prices: [number, number][] }>;
}

/** Search coins by query string. */
export async function searchCoins(
  query: string,
): Promise<{ coins: { id: string; name: string; symbol: string; thumb: string }[] }> {
  const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  return res.json() as Promise<{ coins: { id: string; name: string; symbol: string; thumb: string }[] }>;
}

/** Fetch fiat exchange rates (base: BTC, cross to get USD rates). */
export async function fetchExchangeRates(): Promise<
  Record<string, { name: string; unit: string; value: number; type: string }>
> {
  const url = `${COINGECKO_BASE}/exchange_rates`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
  const data = (await res.json()) as {
    rates: Record<string, { name: string; unit: string; value: number; type: string }>;
  };
  return data.rates;
}
