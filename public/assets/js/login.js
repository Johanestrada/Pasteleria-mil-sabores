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

            // Obtener perfil del usuario en Firestore para determinar rol y estado
            let perfil = null;
            try {
                const snap = await db.collection('usuario').doc(user.uid).get();
                if (snap.exists) perfil = snap.data();
            } catch (err) {
                console.warn('No se pudo leer perfil de Firestore:', err);
            }

            const rol = perfil?.rol || 'cliente';
            const nombre = perfil?.nombre || correo;

            // Si no existe perfil, crearlo
            if (!perfil) {
                try {
                    console.log('Creando perfil en Firestore para:', correo);
                    await db.collection('usuario').doc(user.uid).set({
                        nombre: nombre,
                        email: correo,
                        rol: rol,
                        activo: true,
                        createdAt: new Date()
                    });
                } catch (err) {
                    console.warn('No se pudo crear perfil en Firestore:', err);
                }
            }

            // Verificar estado activo: si el perfil existe y activo === false, no permitir login
            if (perfil && perfil.activo === false) {
                // Cerrar sesión inmediatamente
                await auth.signOut();
                mensaje.style.color = 'red';
                mensaje.innerText = 'Cuenta desactivada. Contacta con el administrador.';
                return;
            }

            // Guardar en localStorage y redirigir según rol
            localStorage.setItem("usuario", JSON.stringify({ uid: user.uid, nombre, correo, rol }));
            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido " + nombre + ", redirigiendo...";
            setTimeout(() => {
                if (rol === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "../../index.html";
                }
            }, 800);



        } catch (error) {
            console.error("Error login:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Correo o contraseña incorrectos";
        }
    });
});
