import { collection, doc, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

export async function saveLeaderboardEntry(uid, { displayName, photoURL, cfHandle, lcUsername, ccUsername, cfRating, lcRating, ccRating, cpScore, tier, tierColor }) {
  const ref = doc(db, "leaderboard", uid);
  await setDoc(ref, {
    displayName: displayName ?? "Anonymous",
    photoURL:    photoURL    ?? null,
    cfHandle:    cfHandle    ?? null,
    lcUsername:  lcUsername  ?? null,
    ccUsername:  ccUsername  ?? null,
    cfRating:    cfRating    ?? null,
    lcRating:    lcRating    ?? null,
    ccRating:    ccRating    ?? null,
    cpScore:     cpScore     ?? 0,
    tier:        tier        ?? "Beginner",
    tierColor:   tierColor   ?? "#64748b",
    updatedAt:   new Date().toISOString(),
  });
}

export async function getLeaderboard() {
  const ref  = collection(db, "leaderboard");
  const snap = await getDocs(ref);
  const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  return rows.sort((a, b) => (b.cpScore ?? 0) - (a.cpScore ?? 0));
}

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export async function saveSnapshot(uid, { cfRating, lcRating, ccRating, cpScore }) {
  const ref = doc(db, "users", uid, "snapshots", today());
  await setDoc(ref, {
    date:      today(),
    cfRating:  cfRating  ?? null,
    lcRating:  lcRating  ?? null,
    ccRating:  ccRating  ?? null,
    cpScore:   cpScore   ?? null,
    savedAt:   new Date().toISOString(),
  });
}

export async function getSnapshots(uid, count = 60) {
  const ref = collection(db, "users", uid, "snapshots");
  const q   = query(ref, orderBy("date", "asc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// delta between first and last snapshot for a field
export function calcDelta(snapshots, field) {
  if (!snapshots || snapshots.length < 2) return null;
  const first = snapshots[0][field];
  const last  = snapshots[snapshots.length - 1][field];
  if (first == null || last == null) return null;
  return last - first;
}
