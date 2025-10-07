// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
  authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
  projectId: "tiendapasteleriamilsabor-a193d",
  storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
  messagingSenderId: "1022940675339",
  appId: "1:1022940675339:web:e347b3abbbe1e35615360e",
  measurementId: "G-WKZ1WX5H72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);