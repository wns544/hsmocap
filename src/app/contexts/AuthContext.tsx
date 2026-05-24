import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  getIdTokenResult,
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<User>;
  refreshAuthClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  signInAsGuest: async () => {
    throw new Error("AuthProvider is not ready");
  },
  refreshAuthClaims: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const resolveAdminAccess = async (nextUser: User | null, forceRefresh = false) => {
    if (!nextUser) {
      setIsAdmin(false);
      return;
    }

    const fallbackDeveloperUids = String(import.meta.env.VITE_DEVELOPER_UIDS ?? "")
      .split(",")
      .map((uid) => uid.trim())
      .filter(Boolean);

    try {
      const tokenResult = await getIdTokenResult(nextUser, forceRefresh);
      setIsAdmin(tokenResult.claims.admin === true || fallbackDeveloperUids.includes(nextUser.uid));
    } catch {
      setIsAdmin(fallbackDeveloperUids.includes(nextUser.uid));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      await resolveAdminAccess(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
    } catch (error) {
      console.error("로그아웃 에러:", error);
    }
  };

  const signInAsGuest = async () => {
    const credential = await signInAnonymously(auth);
    await resolveAdminAccess(credential.user, true);
    return credential.user;
  };

  const refreshAuthClaims = async () => {
    await resolveAdminAccess(auth.currentUser, true);
  };

  const value = {
    user,
    loading,
    isAdmin,
    signOut,
    signInAsGuest,
    refreshAuthClaims,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
