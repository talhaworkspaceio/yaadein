import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDfLeGWWxShhO3Yanj88_ooFOTk8F2Cm-Q",
  authDomain: "framestudio-e4481.firebaseapp.com",
  databaseURL: "https://framestudio-e4481-default-rtdb.firebaseio.com",
  projectId: "framestudio-e4481",
  storageBucket: "framestudio-e4481.firebasestorage.app",
  messagingSenderId: "105813449385",
  appId: "1:105813449385:web:f46ff428f835d5de8967b8",
  measurementId: "G-HRL1SNWMBG",
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const storage = getStorage(app);

export { app, db, storage };
