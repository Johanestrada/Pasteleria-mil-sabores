document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-login");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensaje-login");

    if (!form) return console.error("No se encontró #form-login");

    // Inicializar Firebase v8
    const firebaseConfig = {
        apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
        authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
        projectId: "tiendapasteleriamilsabor-a193d",
        storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
        messagingSenderId: "1022940675339",
        appId: "1:1022940675339:web:e347b3abbbe1e35615360e",
        measurementId: "G-WKZ1WX5H72"
    };

    if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);

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

        try {
            // Login con Firebase Auth (admin y clientes)
            const userCredential = await auth.signInWithEmailAndPassword(correo, clave);
            const user = userCredential.user;

            // Determinar rol
            const rol = correo === "admin@duocuc.cl" ? "admin" : "cliente";

            // Obtener datos adicionales de Firestore si es cliente
            let nombre = correo;
            if (rol === "cliente") {
                const doc = await db.collection("usuario").doc(user.uid).get();
                if (doc.exists) nombre = doc.data().nombre || correo;
            } else {
                nombre = "Administrador";
            }

            localStorage.setItem("usuario", JSON.stringify({ nombre, correo, rol }));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido " + nombre + ", redirigiendo...";
            setTimeout(() => {
                if (rol === "admin") {
                    window.location.href = "/assets/page/admin.html";
                } else {
                    window.location.href = "/assets/page/usuario.html";
                }
            }, 1000);



        } catch (error) {
            console.error("Error login:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Correo o contraseña incorrectos";
        }
    });
});
