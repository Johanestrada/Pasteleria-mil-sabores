import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

 
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
  authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
  projectId: "tiendapasteleriamilsabor-a193d",
  storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
  messagingSenderId: "1022940675339",
  appId: "1:1022940675339:web:e347b3abbbe1e35615360e",
  measurementId: "G-WKZ1WX5H72"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

try {
  analytics = getAnalytics(app);
} catch (err) {
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

