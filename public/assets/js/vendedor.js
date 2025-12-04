import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import app, { db } from "../config/firebase.js";

const auth = getAuth(app);

const userNombre = document.getElementById("perfil-nombre");
const userEmail = document.getElementById("perfil-email");
const bienvenida = document.getElementById("bienvenida");
const btnLogout = document.getElementById("btn-logout");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    // Permitimos el acceso si el rol es 'vendedor' o si es 'admin'
    if (!docSnap.exists() || (docSnap.data().rol !== "vendedor" && docSnap.data().rol !== "admin")) {
        window.location.href = "login.html";
        return;
    }

    const data = docSnap.data();
    if (userNombre) userNombre.textContent = data.nombre || '';
    if (userEmail) userEmail.textContent = data.email || '';
    if (bienvenida) bienvenida.textContent = `Bienvenido, ${data.nombre || ''}`;
});

// Logout
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        await auth.signOut();
        localStorage.removeItem("usuario");
        window.location.href = "login.html";
    });
}
