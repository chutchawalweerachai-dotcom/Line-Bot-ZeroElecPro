let cachedCsv: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export async function getFaqContent(): Promise<string> {
  const now = Date.now();

  if (cachedCsv !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCsv;
  }

  try {
    const url = process.env.SHEET_CSV_URL;
    if (!url) throw new Error("SHEET_CSV_URL is not set");

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);

    const text = await res.text();
    cachedCsv = text;
    cacheTimestamp = now;
    return cachedCsv;
  } catch (err) {
    if (cachedCsv !== null) {
      console.warn("[sheet] fetch failed, using stale cache:", err);
      return cachedCsv;
    }
    throw err;
  }
}
