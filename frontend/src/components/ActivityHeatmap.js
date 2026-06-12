import { useState } from "react";

const COLORS = ["#1a2030", "#0e4429", "#006d32", "#26a641", "#39d353"];
const MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function colorFor(count) {
  if (count <= 0) return COLORS[0];
  if (count === 1) return COLORS[1];
  if (count <= 3)  return COLORS[2];
  if (count <= 6)  return COLORS[3];
  return COLORS[4];
}

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function buildGrid(activity) {
  const today    = new Date();
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - 364 - today.getDay()); // back to last Sunday, 52 weeks ago

  const weeks = [];
  const cur   = new Date(startDay);

  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = fmt(cur);
      week.push({ date: dateStr, count: cur > today ? -1 : (activity[dateStr] ?? 0), ts: new Date(cur) });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function monthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = week[0].ts.getMonth();
    if (m !== lastMonth) { labels.push({ col: i, label: MONTHS[m] }); lastMonth = m; }
  });
  return labels;
}

export default function ActivityHeatmap({ cfActivity, lcActivity }) {
  const [tooltip, setTooltip] = useState(null);

  // merge CF + LC counts per date
  const activity = {};
  [cfActivity, lcActivity].forEach(src => {
    if (!src) return;
    Object.entries(src).forEach(([date, count]) => {
      activity[date] = (activity[date] ?? 0) + count;
    });
  });

  if (!Object.keys(activity).length) {
    return <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>No submission data available</p>;
  }

  const weeks  = buildGrid(activity);
  const labels = monthLabels(weeks);
  const total  = Object.values(activity).reduce((a, b) => a + b, 0);
  const streak = calcStreak(activity);
  const CELL   = 13;
  const GAP    = 3;
  const STEP   = CELL + GAP;

  return (
    <div>
      {/* summary row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Stat value={total} label="submissions this year" color="#39d353" />
        <Stat value={streak.current} label={`day streak${streak.current > 0 ? " 🔥" : ""}`} color="#f59e0b" />
        <Stat value={streak.longest} label="longest streak" color="#6366f1" />
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#374151", background: "#1e2330", border: "1px solid #2d3748", borderRadius: 99, padding: "3px 10px" }}>
          CF + LC combined
        </span>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* month labels */}
          <div style={{ display: "flex", marginLeft: 28, marginBottom: 4, height: 14 }}>
            {labels.map(({ col, label }) => (
              <span key={col} style={{
                position: "absolute", left: 28 + col * STEP,
                fontSize: 10, color: "#64748b", whiteSpace: "nowrap",
              }}>{label}</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: GAP, marginTop: 18 }}>
            {/* day labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 2 }}>
              {DAYS.map((d, i) => (
                <div key={d} style={{ height: CELL, fontSize: 9, color: i % 2 === 1 ? "#64748b" : "transparent", lineHeight: `${CELL}px`, width: 22, textAlign: "right" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* grid */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={e => setTooltip({ day, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: CELL, height: CELL, borderRadius: 2,
                      background: day.count < 0 ? "transparent" : colorFor(day.count),
                      cursor: day.count > 0 ? "default" : "default",
                      transition: "transform 0.1s",
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = "scale(1.4)"}
                    onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: "#64748b", marginRight: 4 }}>Less</span>
            {COLORS.map((c, i) => (
              <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>More</span>
          </div>
        </div>
      </div>

      {/* tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 12, top: tooltip.y - 36,
          background: "#1e2330", border: "1px solid #2d3748", borderRadius: 6,
          padding: "5px 10px", fontSize: 12, color: "#e2e8f0", pointerEvents: "none", zIndex: 9999,
          whiteSpace: "nowrap",
        }}>
          <strong style={{ color: "#39d353" }}>{tooltip.day.count}</strong>
          {tooltip.day.count === 1 ? " submission" : " submissions"} · {tooltip.day.date}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div>
      <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 6 }}>{label}</span>
    </div>
  );
}

function calcStreak(activity) {
  const today = new Date();
  let current = 0, longest = 0, temp = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = fmt(d);
    if ((activity[key] ?? 0) > 0) {
      temp++;
      if (i === 0 || i <= current + 1) current = temp;
    } else {
      if (i === 0) current = 0;
      temp = 0;
    }
    longest = Math.max(longest, temp);
  }
  return { current, longest };
}
