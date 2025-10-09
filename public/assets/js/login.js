document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-login");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensaje-login");

    if (!form) return console.error("No se encontró #formLogin");

    // Inicializar Firebase

const firebaseConfig = {
  apiKey: "AIzaSyDcGOrjpPcVtxQutZ6R01AXhbkG9ixZitk",
  authDomain: "tiendapasteleriamilsabor-195dc.firebaseapp.com",
  projectId: "tiendapasteleriamilsabor-195dc",
  storageBucket: "tiendapasteleriamilsabor-195dc.appspot.com",
  messagingSenderId: "790229094599",
  appId: "1:790229094599:web:7abf216f776053a6dbeee2",
  measurementId: "G-0XMLPFPNM1"
};

    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerText = "";

    const correo = correoInput.value.trim().toLowerCase();
    const clave = claveInput.value;

    if (!correo || !clave) {
        mensaje.style.color = "red";
        mensaje.innerText = "Debes completar correo y clave";
        return;
    }

    // Admin: autenticar con Firebase Auth
    if (correo === "admin@duoc.cl") {
        try {
            await auth.signInWithEmailAndPassword(correo, clave);
            // Guardar usuario en localStorage
            const usuario = { nombre: "Administrador", correo, rol: "admin" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
            setTimeout(() => {
                window.location.href = `perfilAdmin.html`;
            }, 1000);
        } catch (error) {
            console.error("Error login admin:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Credenciales incorrectas para administrador";
        }
        return;
    }

    // Cliente: validar desde Firestore
    try {
        const query = await db.collection("usuario")
            .where("correo", "==", correo)
            .where("clave", "==", clave)
            .get();

        if (!query.empty) {
            const userData = query.docs[0].data();
            const nombre = userData.nombre || correo;

            // Guardar usuario en localStorage con rol real
            const usuario = { nombre, correo, rol: "cliente" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido cliente, redirigiendo...";
            setTimeout(() => {
                window.location.href = `perfilCliente.html`;
            }, 1000);
        } else {
            mensaje.style.color = "red";
            mensaje.innerText = "Correo o clave incorrectos";
        }
    } catch (error) {
        console.error("Error login cliente:", error);
        mensaje.style.color = "red";
        mensaje.innerText = "Error al verificar usuario";
    }
});
});