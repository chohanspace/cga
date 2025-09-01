// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKfIT1cRa-8Z9aXQoRyXaX1tnLzbVrCKc",
  authDomain: "cloudstation-companion.firebaseapp.com",
  databaseURL: "https://cloudstation-companion-default-rtdb.firebaseio.com",
  projectId: "cloudstation-companion",
  storageBucket: "cloudstation-companion.appspot.com",
  messagingSenderId: "254312116541",
  appId: "1:254312116541:web:2b9493a2b917bf62e19554"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { app, db };
