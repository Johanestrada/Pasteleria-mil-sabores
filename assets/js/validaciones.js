document.addEventListener('DOMContentLoaded', function () {

    // ----------- Registro -----------
    const formRegistro = document.getElementById('form-registro');
    const mensajeRegistro = document.getElementById('mensaje-descuento');

    if (formRegistro) {
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

        // Validación del formulario
        formRegistro.addEventListener('submit', function (e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const region = regionSelect ? regionSelect.value : '';
            const comuna = comunaSelect ? comunaSelect.value : '';
            const fechaNacimiento = document.getElementById('fecha-nacimiento').value;
            const codigo = document.getElementById('codigo').value.trim().toUpperCase();

            let errores = [];
            let promociones = [];

            // Validaciones...
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) errores.push("⚠️ El correo no tiene un formato válido.");
            if (telefono && !/^[0-9]{9}$/.test(telefono)) errores.push("⚠️ El teléfono debe tener 9 dígitos numéricos.");
            if (password !== confirmPassword) errores.push("⚠️ Las contraseñas no coinciden.");
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) errores.push("⚠️ La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
            if (!region) errores.push("⚠️ Debes seleccionar una región.");
            if (!comuna) errores.push("⚠️ Debes seleccionar una comuna.");
            if (!fechaNacimiento) errores.push("⚠️ Debes ingresar tu fecha de nacimiento.");

            // Descuentos
            if (fechaNacimiento) {
                const hoy = new Date();
                const nacimiento = new Date(fechaNacimiento);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
                if (edad > 50) promociones.push("🎉 ¡Felicidades! Recibes un <b>50% de descuento</b> por ser mayor de 50 años.");
                const esCumple = hoy.getDate() === nacimiento.getDate() && hoy.getMonth() === nacimiento.getMonth();
                if (esCumple && email.endsWith("@duocuc.cl")) promociones.push("🎂 ¡Feliz cumpleaños! Como estudiante DUOC recibes una <b>torta gratis</b>.");
            }
            if (codigo === "FELICES50") promociones.push("✅ Obtienes un <b>10% de descuento de por vida</b> con el código FELICES50.");

            // Mostrar mensajes
            if (errores.length > 0) mensajeRegistro.innerHTML = `<span class="text-danger">${errores.join("<br>")}</span>`;
            else if (promociones.length > 0) mensajeRegistro.innerHTML = promociones.join("<br>");
            else mensajeRegistro.innerHTML = `<span class="text-success">✅ Registro exitoso!</span>`;
        });
    }

    // ----------- Login -----------
    const formLogin = document.getElementById('form-login');
    const mensajeLogin = document.getElementById('mensaje-login');

    if (formLogin) {
        const adminEmail = "admin@duocuc.cl";
        const adminPassword = "admin123";

        formLogin.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            if (email === adminEmail && password === adminPassword) window.location.href = "admin.html";
            else mensajeLogin.innerHTML = `<span class="text-danger">⚠️ Usuario o contraseña incorrectos.</span>`;
        });
    }
});

// ----------- Contacto -----------

document.addEventListener('DOMContentLoaded', function () {
    const formContacto = document.getElementById('form-contacto');
    const mensajeContacto = document.getElementById('mensaje-contacto');

    if (formContacto) {
        formContacto.addEventListener('submit', function (e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const asunto = document.getElementById('asunto').value.trim();
            const mensaje = document.getElementById('mensaje').value.trim();

            let errores = [];

            // Validar nombre
            if (nombre.length < 3) errores.push("⚠️ El nombre debe tener al menos 3 caracteres.");

            // Validar correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) errores.push("⚠️ El correo no tiene un formato válido.");

            // Validar asunto
            if (asunto.length < 5) errores.push("⚠️ El asunto debe tener al menos 5 caracteres.");

            // Validar mensaje
            if (mensaje.length < 10) errores.push("⚠️ El mensaje debe tener al menos 10 caracteres.");

            // Mostrar errores o éxito
            if (errores.length > 0) {
                mensajeContacto.innerHTML = `<span class="text-danger">${errores.join("<br>")}</span>`;
            } else {
                mensajeContacto.innerHTML = `<span class="text-success">✅ Mensaje enviado correctamente. ¡Gracias por contactarnos!</span>`;
                formContacto.reset();
            }
        });
    }
});
