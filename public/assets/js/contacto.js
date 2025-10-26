document.addEventListener('DOMContentLoaded', function () {
    const firebaseConfig = {
        apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
        authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
        projectId: "tiendapasteleriamilsabor-a193d",
        storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
        messagingSenderId: "1022940675339",
        appId: "1:1022940675339:web:e347b3abbbe1e35615360e",
        measurementId: "G-WKZ1WX5H72"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const formContacto = document.getElementById('form-contacto');
    const mensajeContacto = document.getElementById('mensaje-contacto');

    if (!formContacto) return;

    formContacto.addEventListener('submit', async function (e) {
        e.preventDefault();
        mensajeContacto.innerHTML = "";

        const nombre = document.getElementById('nombre').value.trim();
        const correo = document.getElementById('correo').value.trim().toLowerCase();
        const asunto = document.getElementById('asunto').value.trim();
        const mensaje = document.getElementById('mensaje').value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!nombre || !correo || !asunto || !mensaje) {
            mensajeContacto.innerHTML = `<span class="text-danger">Por favor completa todos los campos.</span>`;
            return;
        }
        if (!emailRegex.test(correo)) {
            mensajeContacto.innerHTML = `<span class="text-danger">El correo no tiene un formato válido.</span>`;
            return;
        }

        try {
            await db.collection('contacto').add({
                nombre,
                correo,
                asunto,
                mensaje,
                fechaEnvio: new Date()
            });

            mensajeContacto.innerHTML = `<span class="text-success">¡Gracias por contactarnos! Te responderemos pronto.</span>`;
            formContacto.reset();
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
            mensajeContacto.innerHTML = `<span class="text-danger">Error al enviar el mensaje. Inténtalo más tarde.</span>`;
        }
    });
});
