import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, provider } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [handles, setHandles] = useState(null);      // saved CF/LC/CC handles

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setHandles(snap.exists() ? snap.data() : null);
      } else {
        setHandles(null);
      }
    });
  }, []);

  async function login() {
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function saveHandles(cf, lc, cc) {
    if (!user) return;
    const data = { cf: cf || "", lc: lc || "", cc: cc || "", updatedAt: new Date().toISOString() };
    await setDoc(doc(db, "users", user.uid), data);
    setHandles(data);
  }

  return (
    <AuthContext.Provider value={{ user, handles, login, logout, saveHandles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
