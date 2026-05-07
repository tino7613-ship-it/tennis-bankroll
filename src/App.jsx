import { useState, useEffect } from "react";

const API = "/api/bets";

function pnl(b) {
  if (b.result === "win") return Math.round((b.cote - 1) * b.mise * 100) / 100;
  if (b.result === "loss") return -b.mise;
  return 0;
}

function getBankroll(bets) {
  let br = 100;
  [...bets].reverse().forEach(b => { br = Math.round((br + pnl(b)) * 100) / 100; });
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
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [user, setUser] = useState(() => localStorage.getItem("tb_user") || "");
  const [showUserSelect, setShowUserSelect] = useState(false);

  const [form, setForm] = useState({ match: "", pari: "", cote: "", mise: "", jour: "", tournoi: "Rome 2026" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) { setShowUserSelect(true); return; }
    fetchBets();
  }, [user]);

  async function fetchBets() {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setBets(data.map(b => ({ ...b, mise: parseFloat(b.mise), cote: parseFloat(b.cote) })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function addBet() {
    if (!form.match || !form.pari || !form.cote || !form.mise) return;
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, user, cote: parseFloat(form.cote), mise: parseFloat(form.mise) })
    });
    const newBet = await res.json();
    setBets(prev => [{ ...newBet, mise: parseFloat(newBet.mise), cote: parseFloat(newBet.cote) }, ...prev]);
    setForm({ match: "", pari: "", cote: "", mise: "", jour: "", tournoi: "Rome 2026" });
    setShowForm(false);
  }

  async function setResult(id, result) {
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, result })
    });
    const updated = await res.json();
    setBets(prev => prev.map(b => b.id === id ? { ...updated, mise: parseFloat(updated.mise), cote: parseFloat(updated.cote) } : b));
  }

  async function resetResult(id) {
    await setResult(id, "pending");
  }

  async function deleteBet(id) {
    await fetch(API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    setBets(prev => prev.filter(b => b.id !== id));
  }

  function selectUser(u) {
    setUser(u);
    localStorage.setItem("tb_user", u);
    setShowUserSelect(false);
  }

  const myBets = bets.filter(b => b.user_name === user);
  const filteredBets = tab === "all" ? myBets : myBets.filter(b => b.result === tab);
  const stats = getStats(myBets);
  const bankroll = getBankroll(myBets);
  const jours = [...new Set(myBets.map(b => b.jour))].filter(Boolean);

  if (showUserSelect) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#e8e8f0", fontSize: "18px", marginBottom: "1.5rem" }}>Qui es-tu ?</div>
        {["Valentin", "Ami"].map(u => (
          <button key={u} onClick={() => selectUser(u)} style={{ display: "block", width: "100%", marginBottom: "0.75rem", padding: "12px 24px", background: "#1a1a2e", border: "1px solid #333", borderRadius: "8px", color: "#e8e8f0", fontSize: "16px", cursor: "pointer" }}>{u}</button>
        ))}
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8e8f0" }}>Chargement...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e8f0", fontFamily: "system-ui, sans-serif", maxWidth: "480px", margin: "0 auto", padding: "1rem" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#555", letterSpacing: "2px" }}>TENNIS BANKROLL</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#e8e8f0" }}>{bankroll.toFixed(2)}€</div>
          <div style={{ fontSize: "11px", color: stats.gain >= 0 ? "#00ff88" : "#ff4466" }}>{stats.gain >= 0 ? "+" : ""}{stats.gain.toFixed(2)}€ • ROI {stats.roi}%</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#555", cursor: "pointer" }} onClick={() => setShowUserSelect(true)}>{user} ↓</div>
          <div style={{ fontSize: "11px", color: "#555" }}>{stats.won}/{stats.done} gagnés</div>
          <button onClick={() => setShowForm(!showForm)} style={{ marginTop: "0.5rem", padding: "8px 16px", background: "#1a1a2e", border: "1px solid #333", borderRadius: "6px", color: "#e8e8f0", cursor: "pointer", fontSize: "13px" }}>+ Pari</button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
          {[["Match", "match"], ["Pari", "pari"], ["Cote", "cote"], ["Mise (€)", "mise"], ["Jour", "jour"], ["Tournoi", "tournoi"]].map(([label, key]) => (
            <div key={key} style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>{label}</div>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: "6px", padding: "8px", color: "#e8e8f0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", marginTop: "0.75rem" }}>
            <button onClick={addBet} style={{ flex: 1, padding: "10px", background: "#1a1a2e", border: "1px solid #333", borderRadius: "6px", color: "#e8e8f0", cursor: "pointer" }}>Ajouter</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid #222", borderRadius: "6px", color: "#555", cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1rem", overflowX: "auto" }}>
        {[["all", "Tous"], ["pending", "En attente"], ["win", "Gagnés"], ["loss", "Perdus"]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{ padding: "6px 12px", background: tab === val ? "#1a1a2e" : "transparent", border: `1px solid ${tab === val ? "#333" : "#1a1a1a"}`, borderRadius: "20px", color: tab === val ? "#e8e8f0" : "#555", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* Liste des paris */}
      {jours.map(jour => {
        const betsJour = filteredBets.filter(b => b.jour === jour);
        if (betsJour.length === 0) return null;
        return (
          <div key={jour} style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", color: "#555", letterSpacing: "1px", marginBottom: "0.5rem" }}>{jour}</div>
            {betsJour.map(b => {
              const p = pnl(b);
              return (
                <div key={b.id} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "2px" }}>{b.match_name}</div>
                      <div style={{ fontSize: "13px", color: "#e8e8f0" }}>{b.pari}</div>
                    </div>
                    <div style={{ fontSize: "13px", color: "#555", minWidth: "40px" }}>@{b.cote}</div>
                    <div style={{ fontSize: "13px", color: "#888", minWidth: "50px" }}>{b.mise.toFixed(2)}€</div>
                    <div style={{ minWidth: "80px" }}>
                      {b.result === "pending" ? <span style={{ fontSize: "11px", color: "#ffaa00", letterSpacing: "1px" }}>EN ATTENTE</span>
                        : b.result === "win" ? <span style={{ fontSize: "11px", color: "#00ff88", letterSpacing: "1px" }}>✓ GAGNÉ</span>
                        : <span style={{ fontSize: "11px", color: "#ff4466", letterSpacing: "1px" }}>✗ PERDU</span>}
                    </div>
                    <div style={{ minWidth: "60px", fontSize: "14px", fontWeight: "700", color: b.result === "pending" ? "#333" : p >= 0 ? "#00ff88" : "#ff4466" }}>
                      {b.result !== "pending" ? `${p >= 0 ? "+" : ""}${p.toFixed(2)}€` : "-"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    {b.result === "pending" ? (
                      <>
                        <button onClick={() => setResult(b.id, "win")} style={{ padding: "4px 12px", background: "#00ff8822", border: "1px solid #00ff88", borderRadius: "6px", color: "#00ff88", cursor: "pointer", fontSize: "12px" }}>✓ Gagné</button>
                        <button onClick={() => setResult(b.id, "loss")} style={{ padding: "4px 12px", background: "#ff446622", border: "1px solid #ff4466", borderRadius: "6px", color: "#ff4466", cursor: "pointer", fontSize: "12px" }}>✗ Perdu</button>
                        <button onClick={() => deleteBet(b.id)} style={{ padding: "4px 12px", background: "transparent", border: "1px solid #222", borderRadius: "6px", color: "#444", cursor: "pointer", fontSize: "12px" }}>Suppr</button>
                      </>
                    ) : (
                      <button onClick={() => resetResult(b.id)} style={{ padding: "4px 12px", background: "#33333322", border: "1px solid #555", borderRadius: "6px", color: "#555", cursor: "pointer", fontSize: "12px" }}>Réinitialiser</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {filteredBets.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#333", fontSize: "13px" }}>Aucun pari pour l'instant</div>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "10px", color: "#222", letterSpacing: "2px" }}>
        TENNIS BANKROLL SYSTEM — ROME 2026
      </div>
    </div>
  );
}
