// backend/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchRaydiumPairs } from "./sources/raydium.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 8080);

// ====== PAMIĘĆ (stan) ======
let state = {
  tokens: [],        // lista zmapowanych par (Raydium)
  updatedAt: null
};

// ====== ODŚWIEŻANIE DANYCH ======
async function refresh() {
  try {
    const pairs = await fetchRaydiumPairs(50);
    state.tokens = pairs;
    state.updatedAt = new Date().toISOString();
    console.log(`[refresh] Raydium ok, items=${pairs.length}`);
  } catch (e) {
    console.error("[refresh] error:", e?.message || e);
  }
}

// start na zimno + co 30s
await refresh();
setInterval(refresh, 30_000);

// ====== ENDPOINTY ======
// zdrowie
app.get("/health", (_req, res) => {
  res.json({ ok: true, updatedAt: state.updatedAt, count: state.tokens.length });
});

// frontend oczekuje /migrations -> zwracamy tokens w tym samym formacie
app.get("/migrations", (req, res) => {
  const windowHours = Number(req.query.windowHours || 24);
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  const list = state.tokens
    .filter((e) => new Date(e.timeISO).getTime() >= cutoff)
    .sort((a, b) => new Date(b.timeISO).getTime() - new Date(a.timeISO).getTime());
  res.json(list);
});

// (opcjonalnie) surowy podgląd całości
app.get("/tokens", (_req, res) => {
  res.json({ items: state.tokens, updatedAt: state.updatedAt });
});

// ====== START ======
app.listen(PORT, () => console.log("backend ready on", PORT));
