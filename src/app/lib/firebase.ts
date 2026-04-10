import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBZAR77YE6tv7_QzqOE-21Syn9MRO7l2jk",
  authDomain: "hsmocap-d907e.firebaseapp.com",
  projectId: "hsmocap-d907e",
  storageBucket: "hsmocap-d907e.firebasestorage.app",
  messagingSenderId: "657235758107",
  appId: "1:657235758107:web:bd56d8edc801a011b17cbe",
  measurementId: "G-V0LTZ2MSBN",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-northeast3");
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();

export let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }

  void isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { app };
export default app;
