// Usa módulos Firebase v9+ desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
  authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
  projectId: "tiendapasteleriamilsabor-a193d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const userNameEl = document.getElementById("user-name");
const bienvenidaEl = document.getElementById("bienvenida");
const perfilNombreEl = document.getElementById("perfil-nombre");
const perfilEmailEl = document.getElementById("perfil-email");
const emailInfoEl = document.getElementById("email-info");
const userAvatar = document.getElementById("user-avatar");
const btnLogout = document.getElementById("btn-logout");
const logoutLink = document.getElementById("logout-link");

function setUserUI(name, email, photoURL) {
  const display = name || email || "Cliente";
  if (userNameEl) userNameEl.textContent = display;
  if (bienvenidaEl) bienvenidaEl.textContent = `Bienvenido, ${display}`;
  if (perfilNombreEl) perfilNombreEl.textContent = name || "-";
  if (perfilEmailEl) perfilEmailEl.textContent = email || "-";
  if (emailInfoEl) emailInfoEl.textContent = email ? `Correo: ${email}` : "";
  if (userAvatar && photoURL) userAvatar.src = photoURL;
}

// Escucha estado de autenticación
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // usuario no autenticado => redirigir al login
    window.location.href = "../page/login.html";
    return;
  }

  // intenta obtener datos en Firestore (colección "usuario") buscando por email
  try {
    const usuariosCol = collection(db, "usuario");
    const q = query(usuariosCol, where("email", "==", user.email), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      const data = doc.data();
      const nombre = data.nombre || data.name || data.displayName || user.displayName || "";
      const photo = data.photoURL || user.photoURL || "";
      setUserUI(nombre, user.email, photo);
    } else {
      // si no hay doc en Firestore, usa info de Auth
      setUserUI(user.displayName || "", user.email, user.photoURL || "");
    }
  } catch (err) {
    console.error("Error al leer Firestore:", err);
    setUserUI(user.displayName || "", user.email, user.photoURL || "");
  }
});

// cerrar sesión
function doLogout() {
  signOut(auth).then(() => {
    window.location.href = "../page/login.html";
  }).catch((err) => {
    console.error("Error al cerrar sesión:", err);
    alert("No se pudo cerrar sesión.");
  });
}

if (btnLogout) btnLogout.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
if (logoutLink) logoutLink.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });