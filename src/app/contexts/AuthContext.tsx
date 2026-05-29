import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type User,
  getIdTokenResult,
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth } from "../lib/firebase";
import { isLocalTestMode } from "../lib/localTestMode";
import { resolveProfileName } from "../lib/profileName";
import { syncCurrentUserProfile } from "../lib/userProfiles";

const DEV_AUTH_STORAGE_KEY = "wordy.dev-auth-user";
const LOCAL_ADMIN_EMAILS = ["hsmocap@gmail.com", "wns544@naver.com"];

type LocalTestRole = "user" | "admin";

interface StoredDevAuthUser {
  role: LocalTestRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<User>;
  refreshAuthClaims: () => Promise<void>;
  signInForLocalTest: (role: LocalTestRole) => Promise<User>;
  isLocalTestAuthEnabled: boolean;
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
  signInForLocalTest: async () => {
    throw new Error("Local test auth is not enabled");
  },
  isLocalTestAuthEnabled: false,
});

function buildLocalTestUser(role: LocalTestRole) {
  const now = new Date().toISOString();
  const email = role === "admin" ? LOCAL_ADMIN_EMAILS[0] : "localtester@wordy.dev";
  const displayName = role === "admin" ? "로컬 관리자" : "로컬 테스트 유저";

  return {
    uid: role === "admin" ? "local-admin" : "local-user",
    email,
    displayName,
    isAnonymous: false,
    emailVerified: true,
    phoneNumber: null,
    photoURL: null,
    providerId: "local-test",
    providerData: [
      {
        providerId: "local-test",
        uid: email,
        displayName,
        email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    metadata: {
      creationTime: now,
      lastSignInTime: now,
    },
    tenantId: null,
  } as unknown as User;
}

function readStoredLocalTestRole(): LocalTestRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(DEV_AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredDevAuthUser;
    return parsed.role === "admin" || parsed.role === "user" ? parsed.role : null;
  } catch {
    return null;
  }
}

function writeStoredLocalTestRole(role: LocalTestRole | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!role) {
    window.localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
  } else {
    window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify({ role }));
  }

  window.dispatchEvent(new Event("wordy:dev-auth-changed"));
}

function getEffectiveUser(firebaseUser: User | null, isLocalTestAuthEnabled: boolean) {
  const localRole = isLocalTestAuthEnabled ? readStoredLocalTestRole() : null;
  return localRole ? buildLocalTestUser(localRole) : firebaseUser;
}

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
  const isLocalTestAuthEnabled = isLocalTestMode();

  const resolveAdminAccess = async (nextUser: User | null, forceRefresh = false) => {
    if (!nextUser) {
      setIsAdmin(false);
      return;
    }

    if (isLocalTestAuthEnabled && nextUser.providerId === "local-test") {
      setIsAdmin(LOCAL_ADMIN_EMAILS.includes((nextUser.email ?? "").toLowerCase()));
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
    let activityTimer: number | null = null;
    let latestFirebaseUser: User | null = auth.currentUser;

    const clearActivityTimer = () => {
      if (activityTimer !== null) {
        window.clearInterval(activityTimer);
        activityTimer = null;
      }
    };

    const startPresenceSync = (currentUser: User) => {
      const displayName = resolveProfileName(currentUser.displayName, currentUser.email);

      void syncCurrentUserProfile(currentUser, displayName, { markLogin: true }).catch((error) => {
        console.error("Failed to record recent login:", error);
      });

      clearActivityTimer();
      activityTimer = window.setInterval(() => {
        void syncCurrentUserProfile(currentUser, displayName).catch((error) => {
          console.error("Failed to record recent activity:", error);
        });
      }, 30 * 1000);
    };

    const applyUser = async (nextUser: User | null) => {
      setUser(nextUser);
      await resolveAdminAccess(nextUser);
      setLoading(false);

      clearActivityTimer();
      if (nextUser) {
        startPresenceSync(nextUser);
      }
    };

    const applyEffectiveUser = () => {
      void applyUser(getEffectiveUser(latestFirebaseUser, isLocalTestAuthEnabled));
    };

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      latestFirebaseUser = nextUser;
      applyEffectiveUser();
    });

    const handleLocalAuthChange = () => applyEffectiveUser();

    const handleVisibilityChange = () => {
      const currentUser = getEffectiveUser(latestFirebaseUser, isLocalTestAuthEnabled);
      if (!currentUser || document.visibilityState !== "visible") {
        return;
      }

      const displayName = resolveProfileName(currentUser.displayName, currentUser.email);
      void syncCurrentUserProfile(currentUser, displayName).catch((error) => {
        console.error("Failed to record visible activity:", error);
      });
    };

    if (isLocalTestAuthEnabled) {
      window.addEventListener("wordy:dev-auth-changed", handleLocalAuthChange);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearActivityTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (isLocalTestAuthEnabled) {
        window.removeEventListener("wordy:dev-auth-changed", handleLocalAuthChange);
      }
      unsubscribe();
    };
  }, [isLocalTestAuthEnabled]);

  const signOut = async () => {
    if (isLocalTestAuthEnabled) {
      writeStoredLocalTestRole(null);
    }

    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  const signInAsGuest = async () => {
    if (isLocalTestAuthEnabled) {
      const localUser = buildLocalTestUser("user");
      writeStoredLocalTestRole("user");
      setUser(localUser);
      setIsAdmin(false);
      return localUser;
    }

    const credential = await signInAnonymously(auth);
    await resolveAdminAccess(credential.user, true);
    return credential.user;
  };

  const refreshAuthClaims = async () => {
    await resolveAdminAccess(user, true);
  };

  const signInForLocalTest = async (role: LocalTestRole) => {
    if (!isLocalTestAuthEnabled) {
      throw new Error("Local test auth is not enabled");
    }

    const localUser = buildLocalTestUser(role);
    writeStoredLocalTestRole(role);
    setUser(localUser);
    setIsAdmin(role === "admin");
    return localUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signOut,
        signInAsGuest,
        refreshAuthClaims,
        signInForLocalTest,
        isLocalTestAuthEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
