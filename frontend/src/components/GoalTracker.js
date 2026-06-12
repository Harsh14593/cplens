import { useState, useEffect } from "react";
import { saveGoal, deleteGoal, getGoals } from "../utils/progress";

const GOAL_TYPES = [
  { id: "cf_rating",  label: "CF Rating",         platform: "cf",  color: "#6366f1", unit: "",   hint: "e.g. 1600" },
  { id: "lc_rating",  label: "LC Contest Rating",  platform: "lc",  color: "#f59e0b", unit: "",   hint: "e.g. 2000" },
  { id: "lc_solved",  label: "LC Problems Solved", platform: "lc",  color: "#f59e0b", unit: "",   hint: "e.g. 200"  },
  { id: "cc_rating",  label: "CC Rating",          platform: "cc",  color: "#22c55e", unit: "",   hint: "e.g. 2000" },
  { id: "cp_score",   label: "CP Score",           platform: "all", color: "#a855f7", unit: "",   hint: "e.g. 2000" },
];

function getCurrentValue(type, data, cpScore) {
  switch (type) {
    case "cf_rating":  return data.user?.rating ?? null;
    case "lc_rating":  return data.lc?.contest_ranking?.rating ? Math.round(data.lc.contest_ranking.rating) : null;
    case "lc_solved":  return data.lc?.profile?.ac_stats?.find(s => s.difficulty === "All")?.count ?? null;
    case "cc_rating":  return data.cc?.rating ?? null;
    case "cp_score":   return cpScore ?? null;
    default: return null;
  }
}

function daysLeft(deadline) {
  const diff = new Date(deadline) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function paceLabel(goal) {
  const days        = daysLeft(goal.deadline);
  const totalDays   = Math.max(1, Math.ceil((new Date(goal.deadline) - new Date(goal.createdAt)) / 86400000));
  const daysPassed  = totalDays - days;
  const needed      = goal.target - goal.startValue;
  const gained      = goal.current - goal.startValue;
  if (days === 0)    return { label: "Deadline reached", color: "#475569" };
  if (gained >= needed) return { label: "Goal reached!", color: "#22c55e" };
  if (daysPassed < 2) return { label: "Just started", color: "#475569" };
  const neededRate  = needed / totalDays;
  const actualRate  = gained / daysPassed;
  if (actualRate >= neededRate * 0.85) return { label: "On pace", color: "#22c55e" };
  if (actualRate >= neededRate * 0.5)  return { label: "Slightly behind", color: "#f59e0b" };
  return { label: "Behind pace", color: "#ef4444" };
}

const LS_KEY = "cplens_goals";
function lsLoad() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }
function lsSave(goals) { try { localStorage.setItem(LS_KEY, JSON.stringify(goals)); } catch {} }

export default function GoalTracker({ data, cpScore, user }) {
  const [goals,    setGoals]    = useState([]);
  const [adding,   setAdding]   = useState(false);
  const [form,     setForm]     = useState({ type: "cf_rating", target: "", deadline: "" });
  const [saving,   setSaving]   = useState(false);

  // load goals on mount
  useEffect(() => {
    if (user) {
      getGoals(user.uid).then(gs => setGoals(gs)).catch(() => setGoals(lsLoad()));
    } else {
      setGoals(lsLoad());
    }
  }, [user]);

  // keep current values fresh
  useEffect(() => {
    setGoals(prev => prev.map(g => ({
      ...g,
      current: getCurrentValue(g.type, data, cpScore) ?? g.current,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, cpScore]);

  async function handleAdd(e) {
    e.preventDefault();
    const typeInfo = GOAL_TYPES.find(t => t.id === form.type);
    const current  = getCurrentValue(form.type, data, cpScore) ?? 0;
    const goal = {
      id:         `${form.type}_${Date.now()}`,
      type:       form.type,
      label:      typeInfo.label,
      color:      typeInfo.color,
      target:     Number(form.target),
      deadline:   form.deadline,
      startValue: current,
      current,
      createdAt:  new Date().toISOString(),
    };
    setSaving(true);
    const updated = [...goals, goal];
    if (user) { try { await saveGoal(user.uid, goal); } catch {} }
    lsSave(updated);
    setGoals(updated);
    setAdding(false);
    setForm({ type: "cf_rating", target: "", deadline: "" });
    setSaving(false);
  }

  async function handleDelete(goalId) {
    if (user) { try { await deleteGoal(user.uid, goalId); } catch {} }
    const updated = goals.filter(g => g.id !== goalId);
    lsSave(updated);
    setGoals(updated);
  }

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  return (
    <div>
      {goals.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "28px 20px", color: "#475569" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: 14, marginBottom: 6, color: "#94a3b8" }}>No goals set yet</div>
          <div style={{ fontSize: 12, marginBottom: 20 }}>Set a target rating with a deadline and track your pace</div>
          <button onClick={() => setAdding(true)} style={addBtnStyle}>+ Set a Goal</button>
        </div>
      )}

      {goals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {goals.map(g => <GoalCard key={g.id} goal={g} onDelete={() => handleDelete(g.id)} />)}
        </div>
      )}

      {goals.length > 0 && !adding && (
        <button onClick={() => setAdding(true)} style={addBtnStyle}>+ Add Goal</button>
      )}

      {adding && (
        <form onSubmit={handleAdd} style={{
          marginTop: 12, background: "#0f1117", border: "1px solid #2d3748",
          borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>New Goal</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Platform / Metric</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                {GOAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target ({GOAL_TYPES.find(t => t.id === form.type)?.hint})</label>
              <input
                type="number" required min={1}
                placeholder={GOAL_TYPES.find(t => t.id === form.type)?.hint}
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="date" required min={minDateStr}
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setAdding(false)} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={submitBtnStyle}>{saving ? "Saving…" : "Set Goal"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function GoalCard({ goal, onDelete }) {
  const pct   = Math.min(100, Math.round(Math.max(0, goal.current - goal.startValue) / Math.max(1, goal.target - goal.startValue) * 100));
  const pace  = paceLabel(goal);
  const days  = daysLeft(goal.deadline);
  const done  = goal.current >= goal.target;

  return (
    <div style={{
      background: "#0f1117", border: `1px solid #2d3748`,
      borderLeft: `3px solid ${goal.color}`, borderRadius: 12, padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: goal.color, background: goal.color + "18", padding: "2px 10px", borderRadius: 99, letterSpacing: "0.5px" }}>
            {goal.label.toUpperCase()}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pace.color, background: pace.color + "18", padding: "2px 8px", borderRadius: 99 }}>
            {done ? "✓ Done" : pace.label}
          </span>
        </div>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      {/* progress bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: done ? "#22c55e" : goal.color }}>{goal.current ?? "—"}</span>
            <span style={{ fontSize: 13, color: "#475569", marginLeft: 6 }}>/ {goal.target}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#475569" }}>
              {days === 0 ? "Deadline today" : `${days} day${days !== 1 ? "s" : ""} left`}
            </div>
            <div style={{ fontSize: 10, color: "#374151" }}>{new Date(goal.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
        </div>
        <div style={{ height: 6, background: "#1e2330", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: done ? "#22c55e" : goal.color, borderRadius: 99, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "#374151" }}>Start: {goal.startValue}</span>
          <span style={{ fontSize: 10, color: done ? "#22c55e" : "#475569", fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>

      {!done && (
        <div style={{ fontSize: 11, color: "#475569" }}>
          {goal.target - goal.current > 0
            ? `${goal.target - goal.current} points to go · need ${Math.ceil((goal.target - goal.current) / Math.max(1, days))} pts/day`
            : "Target reached!"}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, color: "#475569", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6 };
const inputStyle = { width: "100%", boxSizing: "border-box", background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e2e8f0", outline: "none" };
const addBtnStyle = { padding: "8px 20px", borderRadius: 8, border: "1px solid #2d3748", background: "#1a1f2e", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const cancelBtnStyle = { padding: "8px 18px", borderRadius: 8, border: "1px solid #2d3748", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer" };
const submitBtnStyle = { padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
