import styles from "./Skeleton.module.css";

// primitive bone — use width/height/style to shape it
export function Bone({ w = "100%", h = 16, circle = false, pill = false, style = {} }) {
  return (
    <div
      className={[styles.bone, circle ? styles.circle : pill ? styles.pill : ""].join(" ")}
      style={{ width: w, height: h, flexShrink: 0, ...style }}
    />
  );
}

// ── composed skeletons ────────────────────────────────────────────────────────

export function CPScoreSkeleton() {
  return (
    <div className={styles.card} style={{ marginBottom: 24 }}>
      <Bone w={120} h={11} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Bone w={160} h={56} style={{ marginBottom: 12 }} />
          <Bone w={100} h={13} />
        </div>
        <Bone circle w={88} h={88} />
      </div>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {["80%", "92%", "60%"].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Bone w={80} h={11} />
            <Bone w={w} h={8} pill />
            <Bone w={40} h={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformCardSkeleton() {
  return (
    <div style={{
      background: "#1e2330", border: "1px solid #2d3748",
      borderRadius: 14, padding: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <Bone w={90} h={13} />
        <Bone w={50} h={13} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <Bone w={60} h={10} style={{ marginBottom: 8 }} />
            <Bone w={80} h={22} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className={styles.card} style={{ marginBottom: 24 }}>
      <Bone w={140} h={11} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {Array.from({ length: 52 * 7 }, (_, i) => (
          <Bone key={i} w={12} h={12} style={{ borderRadius: 2, margin: 1 }} />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ h = 240, label = "" }) {
  return (
    <div className={styles.card}>
      <Bone w={label ? label.length * 8 : 120} h={11} style={{ marginBottom: 20 }} />
      <div style={{ position: "relative", height: h }}>
        <Bone w="100%" h={h} style={{ borderRadius: 8 }} />
        {/* fake y-axis lines */}
        {[0.2, 0.45, 0.7].map(pct => (
          <div key={pct} style={{
            position: "absolute", left: 0, right: 0,
            top: `${pct * 100}%`,
            borderTop: "1px solid #2d374840",
          }} />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className={styles.card}>
      <Bone w={120} h={11} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: lines }, (_, i) => (
          <Bone key={i} w={i % 3 === 2 ? "60%" : "100%"} h={14} />
        ))}
      </div>
    </div>
  );
}

// Full dashboard skeleton — mirrors the real layout
export function DashboardSkeleton({ cfHandle, lcUsername, ccUsername }) {
  const platformCount = [cfHandle, lcUsername, ccUsername].filter(Boolean).length || 3;
  return (
    <>
      {/* CP Score */}
      <CPScoreSkeleton />

      {/* Platform cards */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(platformCount, 3)}, 1fr)`, gap: 20, marginBottom: 24 }}>
        {Array.from({ length: platformCount }, (_, i) => <PlatformCardSkeleton key={i} />)}
      </div>

      {/* Heatmap */}
      <HeatmapSkeleton />

      {/* 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 24 }}>
        <ChartSkeleton h={240} />
        <CardSkeleton lines={6} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
      </div>
    </>
  );
}
