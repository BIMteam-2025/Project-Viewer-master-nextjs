// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCARQA115jjgKq8MFK9h-s8lgztwgrA29g",
  authDomain: "revit-api-test.firebaseapp.com",
  databaseURL: "https://revit-api-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "revit-api-test",
  storageBucket: "revit-api-test.firebasestorage.app",
  messagingSenderId: "117903387594",
  appId: "1:117903387594:web:928f2be5cdc3644d76fd33",
  measurementId: "G-QKW6J1D6LY"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };
