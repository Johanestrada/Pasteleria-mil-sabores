document.addEventListener('DOMContentLoaded', function () {

    // ----------- CONFIGURACIÓN FIREBASE -----------
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

    const auth = firebase.auth();
    const db = firebase.firestore();

    // ----------- ELEMENTOS DEL FORMULARIO -----------
    const formRegistro = document.getElementById('form-registro');
    if (!formRegistro) return;

    const mensajeRegistro = document.getElementById('mensaje-descuento');
    const regionSelect = document.getElementById('region');
    const comunaSelect = document.getElementById('comuna');

    const comunasPorRegion = {
        rm: ["Santiago", "Puente Alto", "Maipú", "Las Condes", "Ñuñoa"],
        valparaiso: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
        biobio: ["Concepción", "Talcahuano", "Chiguayante", "Los Ángeles"],
        araucania: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón"],
        antofagasta: ["Antofagasta", "Calama", "Mejillones", "Tocopilla"]
    };

    // Llenar comunas dinámicamente
    if (regionSelect && comunaSelect) {
        regionSelect.addEventListener('change', function () {
            const region = this.value;
            comunaSelect.innerHTML = '<option value="" disabled selected>Seleccione una comuna</option>';
            if (comunasPorRegion[region]) {
                comunasPorRegion[region].forEach(comuna => {
                    const option = document.createElement('option');
                    option.value = comuna.toLowerCase().replace(/\s+/g, '-');
                    option.textContent = comuna;
                    comunaSelect.appendChild(option);
                });
            }
        });
    }

    // ----------- ENVÍO DEL FORMULARIO -----------
    formRegistro.addEventListener('submit', async function (e) {
        e.preventDefault();
        mensajeRegistro.innerHTML = "";

        // Recolectar datos
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const region = regionSelect ? regionSelect.value : '';
        const comuna = comunaSelect ? comunaSelect.value : '';
        const fechaNacimiento = document.getElementById('fecha-nacimiento').value;
        const codigo = document.getElementById('codigo').value.trim().toUpperCase();

        let errores = [];
        let promociones = [];

        // ----------- VALIDACIONES -----------
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) errores.push("El correo no tiene un formato válido.");
        if (telefono && !/^[0-9]{9}$/.test(telefono)) errores.push("El teléfono debe tener 9 dígitos numéricos.");
        if (password !== confirmPassword) errores.push("Las contraseñas no coinciden.");
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) errores.push("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
        if (!region) errores.push("Debes seleccionar una región.");
        if (!comuna) errores.push("Debes seleccionar una comuna.");
        if (!fechaNacimiento) errores.push("Debes ingresar tu fecha de nacimiento.");

        // ----------- DESCUENTOS Y PROMOCIONES -----------
        if (fechaNacimiento) {
            const hoy = new Date();
            const nacimiento = new Date(fechaNacimiento);
            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

            if (edad > 50) promociones.push("¡Felicidades! Recibes un <b>50% de descuento</b> por ser mayor de 50 años.");
            const esCumple = hoy.getDate() === nacimiento.getDate() && hoy.getMonth() === nacimiento.getMonth();
            if (esCumple && email.endsWith("@duocuc.cl")) promociones.push("¡Feliz cumpleaños! Como estudiante DUOC recibes una <b>torta gratis</b>.");
        }

        if (codigo === "FELICES50") promociones.push("Obtienes un <b>10% de descuento de por vida</b> con el código FELICES50.");

        if (errores.length > 0) {
            mensajeRegistro.innerHTML = `<span class="text-danger">${errores.join("<br>")}</span>`;
            return;
        }

        // ----------- CREAR USUARIO EN FIREBASE -----------
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Enviar correo de verificación
            await user.sendEmailVerification();

            // Guardar datos adicionales en Firestore
            await db.collection('usuario').doc(user.uid).set({
                nombre,
                email,
                telefono,
                region,
                comuna,
                fechaNacimiento,
                codigo,
                createdAt: new Date()
            });

            mensajeRegistro.innerHTML = `<span class="text-success">Registro exitoso!.</span>`;

            if (promociones.length > 0) {
                mensajeRegistro.innerHTML += `<br>${promociones.join("<br>")}`;
            }

            formRegistro.reset();

            // Redirigir al panel de usuario
            window.location.href = "usuario.html";
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            mensajeRegistro.innerHTML = `<span class="text-danger">${error.message}</span>`;
        }
    });
});
