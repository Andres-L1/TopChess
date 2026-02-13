import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase Web App Config
const firebaseConfig = {
  apiKey: "AIzaSyCZq00Q7H4Gac-cKrc99tX-Xbikmk4FhZk",
  authDomain: "ajedreztopchess-ee537.firebaseapp.com",
  projectId: "ajedreztopchess-ee537",
  storageBucket: "ajedreztopchess-ee537.firebasestorage.app",
  messagingSenderId: "135701954603",
  appId: "1:135701954603:web:4e7f73cc49e386604dea6e",
  measurementId: "G-G9M4HS6X0X"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
