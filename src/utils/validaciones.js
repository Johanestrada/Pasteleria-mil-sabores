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
    let errores = [];
    let promociones = [];

    // Validaciones
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
    if (codigo && codigo.trim().toUpperCase() === "FELICES50") promociones.push("✅ Obtienes un <b>10% de descuento de por vida</b> con el código FELICES50.");

    return { errores, promociones };
}

// Validación de login
export function validarLogin({ email, password }) {
    const adminEmail = "admin@duocuc.cl";
    const adminPassword = "admin123";
    if (email === adminEmail && password === adminPassword) {
        return { esAdmin: true, error: null };
    }
    return { esAdmin: false, error: "⚠️ Usuario o contraseña incorrectos." };
}

// Validación de contacto
export function validarContacto({ nombre, correo, asunto, mensaje }) {
    let errores = [];
    if (nombre.length < 3) errores.push("⚠️ El nombre debe tener al menos 3 caracteres.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) errores.push("⚠️ El correo no tiene un formato válido.");
    if (asunto.length < 5) errores.push("⚠️ El asunto debe tener al menos 5 caracteres.");
    if (mensaje.length < 10) errores.push("⚠️ El mensaje debe tener al menos 10 caracteres.");
    return errores;
}