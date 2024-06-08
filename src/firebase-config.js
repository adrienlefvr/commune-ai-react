// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import {getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqCvVQWEWc9y2fxE0yB9G0tWH76hRmTq0",
  authDomain: "communeai-d23aa.firebaseapp.com",
  projectId: "communeai-d23aa",
  storageBucket: "communeai-d23aa.appspot.com",
  messagingSenderId: "518682465514",
  appId: "1:518682465514:web:4a4c099ceefd2a937ef393"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signInAnonymously };