import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../firebase";

export async function saveLeaderboardEntry(uid, { displayName, photoURL, cfHandle, lcUsername, ccUsername, cfRating, lcRating, ccRating, cpScore, tier, tierColor, achievementCount, earnedIds }) {
  const ref = doc(db, "leaderboard", uid);
  await setDoc(ref, {
    displayName:      displayName      ?? "Anonymous",
    photoURL:         photoURL         ?? null,
    cfHandle:         cfHandle         ?? null,
    lcUsername:       lcUsername       ?? null,
    ccUsername:       ccUsername       ?? null,
    cfRating:         cfRating         ?? null,
    lcRating:         lcRating         ?? null,
    ccRating:         ccRating         ?? null,
    cpScore:          cpScore          ?? 0,
    tier:             tier             ?? "Beginner",
    tierColor:        tierColor        ?? "#64748b",
    achievementCount: achievementCount ?? 0,
    earnedIds:        earnedIds        ?? [],
    updatedAt:        new Date().toISOString(),
  });
}

export async function getLeaderboard() {
  const ref  = collection(db, "leaderboard");
  const snap = await getDocs(ref);
  const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  rows.sort((a, b) => (b.cpScore ?? 0) - (a.cpScore ?? 0));
  return rows;
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

// goals
export async function saveGoal(uid, goal) {
  await setDoc(doc(db, "users", uid, "goals", goal.id), goal);
}
export async function deleteGoal(uid, goalId) {
  await deleteDoc(doc(db, "users", uid, "goals", goalId));
}
export async function getGoals(uid) {
  const snap = await getDocs(collection(db, "users", uid, "goals"));
  return snap.docs.map(d => d.data());
}

// friends
export async function addFriend(uid, friendUid) {
  await setDoc(doc(db, "users", uid, "friends", friendUid), { uid: friendUid, addedAt: new Date().toISOString() });
}
export async function removeFriend(uid, friendUid) {
  await deleteDoc(doc(db, "users", uid, "friends", friendUid));
}
export async function getFriendUids(uid) {
  const snap = await getDocs(collection(db, "users", uid, "friends"));
  return new Set(snap.docs.map(d => d.id));
}
export async function searchLeaderboard(handle) {
  const col = collection(db, "leaderboard");
  const h = handle.trim();
  const [r1, r2, r3] = await Promise.all([
    getDocs(query(col, where("cfHandle",   "==", h))),
    getDocs(query(col, where("lcUsername", "==", h))),
    getDocs(query(col, where("ccUsername", "==", h))),
  ]);
  const seen = new Set();
  const results = [];
  for (const snap of [r1, r2, r3]) {
    for (const d of snap.docs) {
      if (!seen.has(d.id)) { seen.add(d.id); results.push({ uid: d.id, ...d.data() }); }
    }
  }
  return results;
}

// delta between first and last snapshot for a field
export function calcDelta(snapshots, field) {
  if (!snapshots || snapshots.length < 2) return null;
  const first = snapshots[0][field];
  const last  = snapshots[snapshots.length - 1][field];
  if (first == null || last == null) return null;
  return last - first;
}
