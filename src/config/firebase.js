import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDcGOrjpPcVtxQutZ6R01AXhbkG9ixZitk",
  authDomain: "tiendapasteleriamilsabor-195dc.firebaseapp.com",
  projectId: "tiendapasteleriamilsabor-195dc",
  storageBucket: "tiendapasteleriamilsabor-195dc.appspot.com",
  messagingSenderId: "790229094599",
  appId: "1:790229094599:web:7abf216f776053a6dbeee2",
  measurementId: "G-0XMLPFPNM1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics puede fallar en entornos que no soportan window; lo protegemos
let analytics;
try {
  analytics = getAnalytics(app);
} catch (err) {
  // No crítico: solo informamos en consola si falla (ej. entorno de test o SSR)
  // console.debug('Firebase Analytics no disponible:', err);
}

export const db = getFirestore(app);
export default app;

