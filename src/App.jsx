import { useState, useEffect } from "react";

const API = "/api/bets";
const API_BR = "/api/bankroll";

function pnl(b) {
  if (b.result === "win") return Math.round((b.cote - 1) * b.mise * 100) / 100;
  if (b.result === "loss") return -b.mise;
  return 0;
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
  const [startingBankroll, setStartingBankroll] = useState(100);
  const [showBankrollEdit, setShowBankrollEdit] = useState(false);
  const [newBankroll, setNewBankroll] = useState("");
  const [form, setForm] = useState({ match: "", pari: "", cote: "", mise: "", jour: "", tournoi: "Rome 2026" });
  const [showForm, setShowForm] = useState(false);
  const [editingMise, setEditingMise] = useState(null);
  const [newMise, setNewMise] = useState("");

  useEffect(() => {
    if (!user) { setShowUserSelect(true); return; }
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [betsRes, brRes] = await Promise.all([
        fetch(API),
        fetch(`${API_BR}?user=${user}`)
      ]);
      const betsData = await betsRes.json();
      const brData = await brRes.json();
      setBets(betsData.map(b => ({ ...b, mise: parseFloat(b.mise), cote: parseFloat(b.cote) })));
      setStartingBankroll(parseFloat(brData.starting_amount) || 100);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function saveBankroll() {
    const amount = parseFloat(newBankroll);
    if (!amount || amount <= 0) return;
    await fetch(API_BR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, starting_amount: amount })
    });
    setStartingBankroll(amount);
    setShowBankrollEdit(false);
    setNewBankroll("");
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

  async function saveMise(id) {
    const mise = parseFloat(newMise);
    if (!mise || mise <= 0) return;
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mise })
    });
    const updated = await res.json();
    setBets(prev => prev.map(b => b.id === id ? { ...updated, mise: parseFloat(updated.mise), cote: parseFloat(updated.cote) } : b));
    setEditingMise(null);
    setNewMise("");
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

  async function deleteBet(id) {
    await fetch(API, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
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
  const bankroll = Math.round((startingBankroll + stats.gain) * 100) / 100;
  const jours = [...new Set(myBets.map(b => b.jour))].filter(Boolean);

  const s = {
    page: { minHeight: "100vh", background: "#f5f5f5", fontFamily: "system-ui, sans-serif", maxWidth: "480px", margin: "0 auto", padding: "1rem" },
    card: { background: "#fff", borderRadius: "12px", padding: "1rem", marginBottom: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    label: { fontSize: "11px", color: "#999", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" },
    input: { width: "100%", background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "10px", color: "#222", fontSize: "14px", boxSizing: "border-box", marginBottom: "0.75rem" },
    btnPrimary: { padding: "10px 20px", background: "#2563eb", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
    btnSecondary: { padding: "10px 16px", background: "#f0f0f0", border: "none", borderRadius: "8px", color: "#666", cursor: "pointer", fontSize: "14px" },
    btnGreen: { padding: "5px 12px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "6px", color: "#16a34a", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    btnRed: { padding: "5px 12px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "6px", color: "#dc2626", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    btnGray: { padding: "5px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", color: "#6b7280", cursor: "pointer", fontSize: "12px" },
  };

  if (showUserSelect) return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...s.card, textAlign: "center", padding: "2rem", minWidth: "260px" }}>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "#222", marginBottom: "0.5rem" }}>🎾 Tennis Bankroll</div>
        <div style={{ color: "#999", fontSize: "14px", marginBottom: "1.5rem" }}>Qui es-tu ?</div>
        {["Valentin", "Steven"].map(u => (
          <button key={u} onClick={() => selectUser(u)} style={{ ...s.btnPrimary, display: "block", width: "100%", marginBottom: "0.75rem" }}>{u}</button>
        ))}
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>Chargement...</div>
  );

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={{ ...s.card, background: "#2563eb", color: "#fff", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", opacity: 0.8, letterSpacing: "1px" }}>TENNIS BANKROLL</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ fontSize: "28px", fontWeight: "800" }}>{bankroll.toFixed(2)}€</div>
              <button onClick={() => { setNewBankroll(startingBankroll); setShowBankrollEdit(true); }} style={{ padding: "3px 8px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "11px" }}>✏️ Modifier</button>
            </div>
            <div style={{ fontSize: "13px", opacity: 0.9 }}>{stats.gain >= 0 ? "+" : ""}{stats.gain.toFixed(2)}€ • ROI {stats.roi}% • {stats.won}/{stats.done} gagnés</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", opacity: 0.8, cursor: "pointer", marginBottom: "0.5rem" }} onClick={() => setShowUserSelect(true)}>{user} ↓</div>
            <button onClick={() => setShowForm(!showForm)} style={{ padding: "8px 16px", background: "#fff", border: "none", borderRadius: "8px", color: "#2563eb", cursor: "pointer", fontSize: "14px", fontWeight: "700" }}>+ Pari</button>
          </div>
        </div>
      </div>

      {/* Edit bankroll */}
      {showBankrollEdit && (
        <div style={s.card}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#222", marginBottom: "1rem" }}>💰 Modifier la bankroll de départ</div>
          <div style={s.label}>Montant (€)</div>
          <input type="number" value={newBankroll} onChange={e => setNewBankroll(e.target.value)} style={s.input} placeholder="100" />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={saveBankroll} style={s.btnPrimary}>Sauvegarder</button>
            <button onClick={() => setShowBankrollEdit(false)} style={s.btnSecondary}>Annuler</button>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={s.card}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#222", marginBottom: "1rem" }}>Nouveau pari</div>
          {[["Match", "match", "text"], ["Pari", "pari", "text"], ["Cote", "cote", "number"], ["Mise (€)", "mise", "number"], ["Jour", "jour", "text"], ["Tournoi", "tournoi", "text"]].map(([label, key, type]) => (
            <div key={key}>
              <div style={s.label}>{label}</div>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={s.input} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={addBet} style={s.btnPrimary}>Ajouter</button>
            <button onClick={() => setShowForm(false)} style={s.btnSecondary}>Annuler</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1rem", overflowX: "auto" }}>
        {[["all", "Tous"], ["pending", "En attente"], ["win", "Gagnés"], ["loss", "Perdus"]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{ padding: "7px 14px", background: tab === val ? "#2563eb" : "#fff", border: "1px solid " + (tab === val ? "#2563eb" : "#e0e0e0"), borderRadius: "20px", color: tab === val ? "#fff" : "#666", cursor: "pointer", fontSize: "13px", fontWeight: tab === val ? "600" : "400", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* Paris */}
      {jours.map(jour => {
        const betsJour = filteredBets.filter(b => b.jour === jour);
        if (betsJour.length === 0) return null;
        return (
          <div key={jour}>
            <div style={{ fontSize: "12px", color: "#999", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem", paddingLeft: "4px" }}>{jour}</div>
            {betsJour.map(b => {
              const p = pnl(b);
              return (
                <div key={b.id} style={s.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", color: "#999", marginBottom: "2px" }}>{b.match_name}</div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>{b.pari}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        <div style={{ fontSize: "12px", color: "#666" }}>@{b.cote} • {b.tournoi}</div>
                        {editingMise === b.id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input type="number" value={newMise} onChange={e => setNewMise(e.target.value)} style={{ width: "70px", padding: "3px 6px", border: "1px solid #2563eb", borderRadius: "6px", fontSize: "13px", color: "#222" }} placeholder="€" autoFocus />
                            <button onClick={() => saveMise(b.id)} style={{ ...s.btnGreen, padding: "3px 8px" }}>✓</button>
                            <button onClick={() => setEditingMise(null)} style={{ ...s.btnGray, padding: "3px 8px" }}>✗</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#222" }}>{b.mise.toFixed(2)}€</span>
                            {b.result === "pending" && (
                              <button onClick={() => { setEditingMise(b.id); setNewMise(b.mise); }} style={{ padding: "2px 6px", background: "#f0f4ff", border: "1px solid #bcd0ff", borderRadius: "4px", color: "#2563eb", cursor: "pointer", fontSize: "11px" }}>✏️</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: b.result === "pending" ? "#999" : p >= 0 ? "#16a34a" : "#dc2626" }}>
                        {b.result !== "pending" ? `${p >= 0 ? "+" : ""}${p.toFixed(2)}€` : "-"}
                      </div>
                      <div style={{ fontSize: "11px", color: b.result === "pending" ? "#f59e0b" : b.result === "win" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                        {b.result === "pending" ? "EN ATTENTE" : b.result === "win" ? "✓ GAGNÉ" : "✗ PERDU"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {b.result === "pending" ? (
                      <>
                        <button onClick={() => setResult(b.id, "win")} style={s.btnGreen}>✓ Gagné</button>
                        <button onClick={() => setResult(b.id, "loss")} style={s.btnRed}>✗ Perdu</button>
                        <button onClick={() => deleteBet(b.id)} style={s.btnGray}>Suppr</button>
                      </>
                    ) : (
                      <button onClick={() => setResult(b.id, "pending")} style={s.btnGray}>Réinitialiser</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {filteredBets.length === 0 && (
        <div style={{ ...s.card, textAlign: "center", color: "#999", padding: "2rem" }}>Aucun pari pour l'instant</div>
      )}

      <div style={{ textAlign: "center", fontSize: "11px", color: "#ccc", letterSpacing: "1px", marginTop: "1rem" }}>
        TENNIS BANKROLL SYSTEM — ROME 2026
      </div>
    </div>
  );
}
