// backend/src/sources/raydium.js
import fetch from "node-fetch";

/**
 * Prosta integracja: pobieramy najnowsze pary Raydium z Dexscreener
 * i mapujemy je do naszego formatu.
 *
 * Uwaga: API publiczne => pamiętaj o rate-limit (nie schodź poniżej 10–15s).
 */
export async function fetchRaydiumPairs() {
  const url = "https://api.dexscreener.com/latest/dex/pairs/solana/raydium";
  const r = await fetch(url, { timeout: 15000 });
  if (!r.ok) throw new Error(`Dexscreener HTTP ${r.status}`);
  const data = await r.json();

  // data.pairs = [...]; bierzemy kilka najświeższych
  const now = new Date().toISOString();
  return (data?.pairs || []).slice(0, 50).map(p => ({
    id: `ray_${p.pairAddress}`,
    name: p.baseToken?.name || "Unknown",
    symbol: p.baseToken?.symbol || "-",
    mint: p.baseToken?.address || "",
    dex: "Raydium",
    poolAddress: p.pairAddress,
    // metryki
    priceUSD: p.priceUsd ? Number(p.priceUsd) : null,
    liquidityUSD: p.liquidity?.usd ?? null,
    volume24hUSD: p.volume?.h24 ?? null,
    fdvUSD: p.fdv ?? null,
    // „score” możesz policzyć po swojej stronie – na razie 0
    score: 0,
    holders: null,           // (opcjonalnie uzupełnimy w ETAP 2)
    bondingCurveProgress: 100, // bo to już na AMM
    timeISO: now,
    riskTags: [],
    source: "dexscreener"
  }));
}
