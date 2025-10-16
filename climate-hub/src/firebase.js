import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATKu6JwNMKg4iCwoTP_nyhrK-xfTPAJW4",
  authDomain: "confidencescoringapp.firebaseapp.com",
  projectId: "confidencescoringapp",
  storageBucket: "confidencescoringapp.firebasestorage.app",
  messagingSenderId: "524383744399",
  appId: "1:524383744399:web:ba000c065c6a1898311bfa",
  measurementId: "G-XT7KW3RMH6"
};

//Feature not working now
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
