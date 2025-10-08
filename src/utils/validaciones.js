// Comunas por región
export const comunasPorRegion = {
    rm: ["Santiago", "Puente Alto", "Maipú", "Las Condes", "Ñuñoa"],
    valparaiso: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
    biobio: ["Concepción", "Talcahuano", "Chiguayante", "Los Ángeles"],
    araucania: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón"],
    antofagasta: ["Antofagasta", "Calama", "Mejillones", "Tocopilla"]
};

// Validación de registro
export function validarRegistro({
    nombre,
    email,
    password,
    confirmPassword,
    telefono,
    region,
    comuna,
    fechaNacimiento,
    codigo
}) {
    let promociones = [];

    // Obtener los elementos del DOM si existen (solo si se usa en HTML tradicional)
    const nombreInput = document.getElementById("nombre");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const telefonoInput = document.getElementById("telefono");
    const regionInput = document.getElementById("region");
    const comunaInput = document.getElementById("comuna");
    const fechaInput = document.getElementById("fechaNacimiento");

    // Limpiar mensajes previos
    [nombreInput, emailInput, passwordInput, confirmPasswordInput, telefonoInput, regionInput, comunaInput, fechaInput].forEach(input => {
        if (input) input.setCustomValidity("");
    });

    // Validaciones nativas con reportValidity
    if (!nombre) {
        nombreInput?.setCustomValidity("El nombre es obligatorio.");
        nombreInput?.reportValidity();
        return { errores: ["El nombre es obligatorio."], promociones };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailInput?.setCustomValidity("El correo no tiene un formato válido.");
        emailInput?.reportValidity();
        return { errores: ["El correo no tiene un formato válido."], promociones };
    }

    if (telefono && !/^[0-9]{9}$/.test(telefono)) {
        telefonoInput?.setCustomValidity("El teléfono debe tener 9 dígitos numéricos.");
        telefonoInput?.reportValidity();
        return { errores: ["El teléfono debe tener 9 dígitos numéricos."], promociones };
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        passwordInput?.setCustomValidity("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
        passwordInput?.reportValidity();
        return { errores: ["Contraseña no válida."], promociones };
    }

    if (password !== confirmPassword) {
        confirmPasswordInput?.setCustomValidity("Las contraseñas no coinciden.");
        confirmPasswordInput?.reportValidity();
        return { errores: ["Las contraseñas no coinciden."], promociones };
    }

    if (!region) {
        regionInput?.setCustomValidity("Debes seleccionar una región.");
        regionInput?.reportValidity();
        return { errores: ["Debes seleccionar una región."], promociones };
    }

    if (!comuna) {
        comunaInput?.setCustomValidity("Debes seleccionar una comuna.");
        comunaInput?.reportValidity();
        return { errores: ["Debes seleccionar una comuna."], promociones };
    }

    if (!fechaNacimiento) {
        fechaInput?.setCustomValidity("Debes ingresar tu fecha de nacimiento.");
        fechaInput?.reportValidity();
        return { errores: ["Debes ingresar tu fecha de nacimiento."], promociones };
    }

    // Cálculo de descuentos y promociones
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

    if (edad > 50)
        promociones.push("🎉 ¡Felicidades! Recibes un <b>50% de descuento</b> por ser mayor de 50 años.");

    const esCumple = hoy.getDate() === nacimiento.getDate() && hoy.getMonth() === nacimiento.getMonth();
    if (esCumple && email.endsWith("@duocuc.cl"))
        promociones.push("¡Feliz cumpleaños! Como estudiante DUOC recibes una <b>torta gratis</b>.");

    if (codigo && codigo.trim().toUpperCase() === "FELICES50")
        promociones.push("Obtienes un <b>10% de descuento de por vida</b> con el código FELICES50.");

    return { errores: [], promociones };
}

// Validación de login
export function validarLogin({ email, password }) {
    const adminEmail = "admin@duocuc.cl";
    const adminPassword = "admin123";

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    [emailInput, passwordInput].forEach(input => input?.setCustomValidity(""));

    if (email === adminEmail && password === adminPassword) {
        return { esAdmin: true, error: null };
    }

    passwordInput?.setCustomValidity("Usuario o contraseña incorrectos.");
    passwordInput?.reportValidity();
    return { esAdmin: false, error: "Usuario o contraseña incorrectos." };
}

// Validación de contacto
export function validarContacto({ nombre, correo, asunto, mensaje }) {
    const nombreInput = document.getElementById("nombre");
    const correoInput = document.getElementById("correo");
    const asuntoInput = document.getElementById("asunto");
    const mensajeInput = document.getElementById("mensaje");

    [nombreInput, correoInput, asuntoInput, mensajeInput].forEach(input => input?.setCustomValidity(""));

    if (nombre.length < 3) {
        nombreInput?.setCustomValidity("El nombre debe tener al menos 3 caracteres.");
        nombreInput?.reportValidity();
        return ["El nombre debe tener al menos 3 caracteres."];
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        correoInput?.setCustomValidity("El correo no tiene un formato válido.");
        correoInput?.reportValidity();
        return ["El correo no tiene un formato válido."];
    }

    if (asunto.length < 5) {
        asuntoInput?.setCustomValidity("El asunto debe tener al menos 5 caracteres.");
        asuntoInput?.reportValidity();
        return ["El asunto debe tener al menos 5 caracteres."];
    }

    if (mensaje.length < 10) {
        mensajeInput?.setCustomValidity("El mensaje debe tener al menos 10 caracteres.");
        mensajeInput?.reportValidity();
        return ["El mensaje debe tener al menos 10 caracteres."];
    }

    return [];
}
