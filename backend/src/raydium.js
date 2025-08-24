// backend/src/sources/raydium.js
import fetch from "node-fetch";

/**
 * Pobiera świeże pary z Raydium via Dexscreener (publiczne API)
 * i mapuje na format zgodny z frontendem (/migrations).
 */
export async function fetchRaydiumPairs(limit = 50) {
  const url = "https://api.dexscreener.com/latest/dex/pairs/solana/raydium";
  const res = await fetch(url, { timeout: 15000 });
  if (!res.ok) throw new Error(`Dexscreener HTTP ${res.status}`);
  const data = await res.json();
  const pairs = data?.pairs || [];
  const nowISO = new Date().toISOString();

  return pairs.slice(0, limit).map((p) => {
    const base = p.baseToken || {};
    const dexId = (p.dexId || "").toLowerCase();

    return {
      // ---- pola zgodne z Twoim frontendem (MigrationEvent) ----
      id: p.pairAddress || `${base.address}-${nowISO}`,
      name: base.name || base.symbol || "Unknown",
      symbol: base.symbol || "TKN",
      mint: base.address || "",
      imageUrl: base.iconUrl || "",
      marketCapUSD: Number(p.fdv || p.marketCap || 0),
      liquidityUSD: Number(p.liquidity?.usd || 0),
      holders: null,                 // (opcjonalnie dorobimy w kroku on-chain)
      devReputation: 50,             // placeholder
      riskTags: [],                  // placeholder
      dex: dexId.includes("raydium") ? "Raydium" : "Raydium",
      poolAddress: p.pairAddress || "",
      timeISO: nowISO,               // używamy czasu odświeżenia
      creator: undefined,
      bondingCurveProgress: 100      // bo to już AMM (po migracji)
    };
  });
}
