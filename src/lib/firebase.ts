import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studywise-kw55x",
  appId: "1:391593690241:web:97ee5ba55ff8a18c9c7980",
  storageBucket: "studywise-kw55x.firebasestorage.app",
  apiKey: "AIzaSyCgy5xK5WK9dUnAFzhdfbtlehdZfjvWkvI",
  authDomain: "studywise-kw55x.firebaseapp.com",
  messagingSenderId: "391593690241",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, firestore, googleProvider };
