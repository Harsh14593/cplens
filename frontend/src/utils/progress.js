import { collection, doc, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

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
