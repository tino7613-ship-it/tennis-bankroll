import { useState, useEffect } from "react";

const INIT_BETS = [
  {id:1,strat:"A",jour:"29 avr",match:"Pliskova / Potapova",pari:"Pliskova +4,5 aces",cote:1.70,mise:2.00,result:"pending"},
  {id:2,strat:"A",jour:"29 avr",match:"Kostyuk / Noskova",pari:"Noskova +5,5 aces",cote:2.00,mise:2.00,result:"pending"},
  {id:3,strat:"A",jour:"29 avr",match:"Fils / Lehecka",pari:"Lehecka +5,5 aces",cote:1.70,mise:2.00,result:"pending"},
  {id:4,strat:"B",jour:"29 avr",match:"Fils / Lehecka",pari:"Lehecka +5,5 aces",cote:1.70,mise:2.00,result:"pending"},
  {id:5,strat:"B",jour:"29 avr",match:"Sinner / Jodar",pari:"Sinner gagne -20,5 jeux",cote:1.76,mise:2.00,result:"pending"},
  {id:6,strat:"B",jour:"29 avr",match:"Kostyuk / Noskova",pari:"Kostyuk gagnante",cote:1.48,mise:2.00,result:"pending"},
];

function pnl(b) {
  if (b.result === "win") return Math.round((b.cote - 1) * b.mise * 100) / 100;
  if (b.result === "loss") return -b.mise;
  return 0;
}

function getBankroll(bets, strat) {
  let br = 100;
  bets.filter(b => b.strat === strat && b.result !== "pending")
    .forEach(b => { br = Math.round((br + pnl(b)) * 100) / 100; });
  return br;
}

function getStats(bets) {
  const done = bets.filter(b => b.result !== "pending");
  const won = bets.filter(b => b.result === "win");
  const gain = Math.round(bets.reduce((s, b) => s + pnl(b), 0) * 100) / 100;
  const mise = Math.round(bets.reduce((s, b) => s + b.mise, 0) * 100) / 100;
  const roi = mise > 0 ? Math.round(gain / mise * 1000) / 10 : 0;
  return { done: done.length, total: bets.length, won: won.length, gain, mise, roi };
}

export default function App() {
  const [bets, setBets] = useState(() => {
    try { const s = localStorage.getItem("tb_bets"); return s ? JSON.parse(s) : INIT_BETS; }
    catch { return INIT_BETS; }
  });
  const [tab, setTab] = useState("all");

  useEffect(() => {
    try { localStorage.setItem("tb_bets", JSON.stringify(bets)); } catch {}
  }, [bets]);

  function setResult(id, result) {
    setBets(prev => prev.map(b => b.id === id && b.result === "pending" ? { ...b, result } : b));
  }
  function resetResult(id) {
    setBets(prev => prev.map(b => b.id === id ? { ...b, result: "pending" } : b));
  }

  const brA = getBankroll(bets, "A");
  const brB = getBankroll(bets, "B");
  const deltaA = Math.round((brA - 100) * 100) / 100;
  const deltaB = Math.round((brB - 100) * 100) / 100;
  const sA = getStats(bets.filter(b => b.strat === "A"));
  const sB = getStats(bets.filter(b => b.strat === "B"));

  const tabs = ["all", "A", "B", "compare"];
  const tabLabels = ["Tous", "A — Aces", "B — Mixte", "Comparatif"];

  const filteredBets = tab === "all" ? bets : tab === "compare" ? [] : bets.filter(b => b.strat === tab);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Courier New', monospace", padding: "1.5rem" }}>
      
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#666", marginBottom: "8px" }}>SYSTÈME DE PARIS</div>
        <h1 style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "2px", margin: 0, background: "linear-gradient(135deg, #00ff88, #00aaff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🎾 TENNIS BANKROLL
        </h1>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "6px", letterSpacing: "2px" }}>MADRID OPEN 2026</div>
      </div>

      {/* BANKROLLS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {[{ strat: "A", label: "ACES", br: brA, delta: deltaA, color: "#00ff88" }, { strat: "B", label: "MIXTE", br: brB, delta: deltaB, color: "#00aaff" }].map(({ strat, label, br, delta, color }) => (
          <div key={strat} style={{ background: "#111118", border: `1px solid ${color}22`, borderRadius: "12px", padding: "1.25rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color }} />
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#555", marginBottom: "6px" }}>TABLEAU {strat} — {label}</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color, letterSpacing: "-1px" }}>{br.toFixed(2)}€</div>
            <div style={{ fontSize: "13px", color: delta >= 0 ? "#00ff88" : "#ff4466", marginTop: "4px" }}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}€ {delta >= 0 ? "gain" : "perte"}
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 14px", borderRadius: "6px", fontSize: "12px", letterSpacing: "1px", cursor: "pointer", border: "none",
            background: tab === t ? "#00ff88" : "#111118", color: tab === t ? "#0a0a0f" : "#666",
            fontFamily: "'Courier New', monospace", fontWeight: tab === t ? "700" : "400", transition: "all .15s"
          }}>{tabLabels[i]}</button>
        ))}
      </div>

      {/* COMPARE VIEW */}
      {tab === "compare" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            {[{ strat: "A", s: sA, br: brA, delta: deltaA, color: "#00ff88" }, { strat: "B", s: sB, br: brB, delta: deltaB, color: "#00aaff" }].map(({ strat, s, br, delta, color }) => (
              <div key={strat} style={{ background: "#111118", border: `1px solid ${color}33`, borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ fontSize: "10px", letterSpacing: "3px", color, marginBottom: "12px" }}>TABLEAU {strat}</div>
                {[
                  ["Bankroll", `${br.toFixed(2)}€`, delta >= 0 ? "#00ff88" : "#ff4466"],
                  ["Gain net", `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}€`, delta >= 0 ? "#00ff88" : "#ff4466"],
                  ["Paris joués", `${s.done}/${s.total}`, "#e8e8f0"],
                  ["Gagnés", `${s.won}`, "#00ff88"],
                  ["ROI", `${s.roi >= 0 ? "+" : ""}${s.roi}%`, s.roi >= 0 ? "#00ff88" : "#ff4466"],
                ].map(([label, val, col]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1a1a2a", fontSize: "13px" }}>
                    <span style={{ color: "#555" }}>{label}</span>
                    <span style={{ color: col, fontWeight: "700" }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: "#111118", border: "1px solid #333", borderRadius: "12px", padding: "1rem", textAlign: "center", fontSize: "13px", color: "#666" }}>
            {sA.done + sB.done === 0 ? "⏳ En attente des premiers résultats..." :
              brA > brB ? `🏆 Tableau A (Aces) en tête — ${brA.toFixed(2)}€ vs ${brB.toFixed(2)}€` :
              brB > brA ? `🏆 Tableau B (Mixte) en tête — ${brB.toFixed(2)}€ vs ${brA.toFixed(2)}€` :
              "🤝 Égalité parfaite !"}
          </div>
        </div>
      )}

      {/* BETS TABLE */}
      {tab !== "compare" && (
        <div style={{ background: "#111118", borderRadius: "12px", overflow: "hidden", border: "1px solid #1a1a2a" }}>
          {/* Group by date */}
          {Array.from(new Set(filteredBets.map(b => b.jour))).map(jour => (
            <div key={jour}>
              <div style={{ padding: "8px 16px", background: "#0d0d18", fontSize: "10px", letterSpacing: "3px", color: "#444" }}>📅 {jour}</div>
              {filteredBets.filter(b => b.jour === jour).map(b => {
                const p = pnl(b);
                return (
                  <div key={b.id} style={{ padding: "12px 16px", borderBottom: "1px solid #0d0d18", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {tab === "all" && (
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", letterSpacing: "1px", fontWeight: "700",
                        background: b.strat === "A" ? "#00ff8822" : "#00aaff22", color: b.strat === "A" ? "#00ff88" : "#00aaff" }}>
                        {b.strat}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "2px" }}>{b.match}</div>
                      <div style={{ fontSize: "13px", color: "#e8e8f0" }}>{b.pari}</div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#555", minWidth: "40px" }}>@{b.cote}</div>
                    <div style={{ fontSize: "13px", color: "#888", minWidth: "50px" }}>{b.mise.toFixed(2)}€</div>
                    <div style={{ minWidth: "80px" }}>
                      {b.result === "pending" ? <span style={{ fontSize: "11px", color: "#ffaa00", letterSpacing: "1px" }}>EN ATTENTE</span> :
                       b.result === "win" ? <span style={{ fontSize: "11px", color: "#00ff88", letterSpacing: "1px" }}>✓ GAGNÉ</span> :
                       <span style={{ fontSize: "11px", color: "#ff4466", letterSpacing: "1px" }}>✗ PERDU</span>}
                    </div>
                    <div style={{ minWidth: "60px", fontSize: "14px", fontWeight: "700",
                      color: b.result === "pending" ? "#333" : p >= 0 ? "#00ff88" : "#ff4466" }}>
                      {b.result !== "pending" ? `${p >= 0 ? "+" : ""}${p.toFixed(2)}€` : "—"}
                    </div>
                    {b.result === "pending" ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setResult(b.id, "win")} style={{ padding: "4px 12px", background: "#00ff8822", border: "1px solid #00ff88", borderRadius: "6px", color: "#00ff88", cursor: "pointer", fontSize: "12px", fontFamily: "'Courier New', monospace" }}>✓</button>
                <button onClick={() => setResult(b.id, "loss")} style={{ padding: "4px 12px", background: "#ff446622", border: "1px solid #ff4466", borderRadius: "6px", color: "#ff4466", cursor: "pointer", fontSize: "12px", fontFamily: "'Courier New', monospace" }}>✗</button>
              </div>
            ) : (
              <button onClick={() => resetResult(b.id)} style={{ padding: "4px 12px", background: "#33333322", border: "1px solid #555", borderRadius: "6px", color: "#555", cursor: "pointer", fontSize: "12px", fontFamily: "'Courier New', monospace" }}>↩</button>
            )}
                        
                  </div>
                );
              })}
            </div>
          ))}
          {filteredBets.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#333", fontSize: "13px" }}>Aucun pari pour l'instant</div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "10px", color: "#222", letterSpacing: "2px" }}>
        TENNIS BANKROLL SYSTEM — MADRID 2026
      </div>
    </div>
  );
}