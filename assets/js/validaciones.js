document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form-registro');
    const mensaje = document.getElementById('mensaje-descuento');

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

    // Validación del formulario
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const region = regionSelect.value;
        const comuna = comunaSelect.value;
        const fechaNacimiento = document.getElementById('fecha-nacimiento').value;
        const codigo = document.getElementById('codigo').value.trim().toUpperCase();

        let errores = [];
        let promociones = [];

        // Validaciones básicas
        if (password !== confirmPassword) {
            errores.push("Las contraseñas no coinciden.");
        }

        if (!region) {
            errores.push("Debes seleccionar una región.");
        }

        if (!comuna) {
            errores.push("Debes seleccionar una comuna.");
        }

        if (!fechaNacimiento) {
            errores.push("Debes ingresar tu fecha de nacimiento.");
        }

        // Validación de descuentos/promociones
        if (fechaNacimiento) {
            const hoy = new Date();
            const nacimiento = new Date(fechaNacimiento);

            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();

            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                // Si aún no ha cumplido años este año
                edad--;
            }

            if (edad > 50) {
                promociones.push("🎉 ¡Felicidades! Recibes un <b>50% de descuento</b> por ser mayor de 50 años.");
            }

            // Verificar cumpleaños + correo institucional DUOC
            const esCumple = hoy.getDate() === nacimiento.getDate() && hoy.getMonth() === nacimiento.getMonth();
            if (esCumple && email.endsWith("@duocuc.cl")) {
                promociones.push("🎂 ¡Feliz cumpleaños! Como estudiante DUOC recibes una <b>torta gratis</b>.");
            }
        }

        if (codigo === "FELICES50") {
            promociones.push("✅ Obtienes un <b>10% de descuento de por vida</b> con el código FELICES50.");
        }

        // Mostrar mensajes
        if (errores.length > 0) {
            mensaje.innerHTML = `<span class="text-danger">${errores.join("<br>")}</span>`;
        } else if (promociones.length > 0) {
            mensaje.innerHTML = promociones.join("<br>");
        } else {
            mensaje.innerHTML = `<span class="text-success">Registro exitoso!.</span>`;
        }
    });
});

//Redireccionamos
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form-login');
    const mensaje = document.getElementById('mensaje-login');

    // Datos del admin
    const adminEmail = "admin@duocuc.cl";
    const adminPassword = "admin123";

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Validación simple
        if (email === adminEmail && password === adminPassword) {
            // Redirigir a admin.html
            window.location.href = "admin.html";
        } else {
            mensaje.innerHTML = `<span class="text-danger">⚠️ Usuario o contraseña incorrectos.</span>`;
        }
    });
});
