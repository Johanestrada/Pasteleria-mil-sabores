import { addUser } from "./services/firestoreService.js";
import { validarRegistro, comunasPorRegion } from "./utils/validaciones.js";

import { db } from "./config/firebase.js";


// Espera que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-registro");
  const nombreInput = document.getElementById("nombre");
  const fechaInput = document.getElementById("fecha-nacimiento");
  const correoInput = document.getElementById("email");
  const claveInput = document.getElementById("password");
  const confirmClaveInput = document.getElementById("confirm-password");
  const telefonoInput = document.getElementById("telefono");
  const regionInput = document.getElementById("region");
  const comunaInput = document.getElementById("comuna");
  const codigoInput = document.getElementById("codigo");
  const mensaje = document.getElementById("mensaje-descuento");

  // Validar que el formulario exista
  if (!form) return console.log("No se encontró #form-registro");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerHTML = "";

    // Recoger los valores
    const datos = {
      nombre: nombreInput?.value.trim() || "",
      email: correoInput?.value.trim() || "",
      password: claveInput?.value || "",
      confirmPassword: confirmClaveInput?.value || "",
      telefono: telefonoInput?.value.trim() || "",
      region: regionInput?.value || "",
      comuna: comunaInput?.value || "",
      fechaNacimiento: fechaInput?.value || "",
      codigo: codigoInput?.value || ""
    };

    // Validación
    const { errores, promociones } = validarRegistro(datos);

    if (errores.length > 0) {
      mensaje.innerHTML = errores.join("<br>");
      return;
    }

    // Mostrar promociones si hay
    if (promociones.length > 0) {
      mensaje.innerHTML += promociones.join("<br>");
    }

    // Guardar en Firebase
    try {
      await addUser(datos);
      mensaje.innerHTML += "<br>Formulario enviado correctamente";

      // Redirigir según correo
      setTimeout(() => {
        window.location.href =
          datos.email.toLowerCase() === "admin@duocuc.cl"
            ? `assets/page/perfilAdmin.html?nombre=${encodeURIComponent(datos.nombre)}`
            : `assets/page/perfilCliente.html?nombre=${encodeURIComponent(datos.nombre)}`;
      }, 1000);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      mensaje.innerHTML = "Error al guardar usuario en Firebase";
    }
  });
});
