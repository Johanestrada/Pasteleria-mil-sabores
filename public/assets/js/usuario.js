document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar Firebase v8 (solo si no está ya)
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

    // Referencias DOM
    const userNombre = document.getElementById("perfil-nombre");
    const userEmail = document.getElementById("perfil-email");
    const bienvenida = document.getElementById("bienvenida");
    const btnLogout = document.getElementById("btn-logout");

    // Leer usuario desde localStorage
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
        // No hay datos → volver al login
        window.location.href = "/assets/page/login.html";
        return;
    }

    const usuario = JSON.parse(usuarioStr);
    const { nombre, correo, rol } = usuario;

    // Mostrar datos básicos
    bienvenida.textContent = `Bienvenido, ${nombre}`;
    userNombre.textContent = nombre;
    userEmail.textContent = correo;

    // Validar sesión con Firebase
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // No hay sesión activa → volver a login
            window.location.href = "/assets/page/login.html";
            return;
        }

        // Si es cliente, actualizar info desde Firestore
        if (rol === "cliente") {
            const docRef = db.collection("usuario").doc(user.uid);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                userNombre.textContent = data.nombre || nombre;
                userEmail.textContent = data.email || correo;
                bienvenida.textContent = `Bienvenido, ${data.nombre || nombre}`;
            }
        }
    });

    // Cerrar sesión
    btnLogout.addEventListener("click", async () => {
        await auth.signOut();
        localStorage.removeItem("usuario");
        window.location.href = "/assets/page/login.html";
    });
});
