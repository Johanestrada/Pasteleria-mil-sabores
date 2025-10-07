import { addUser } from "./services/firestoreService";

import {} from "./utils/validaciones"

document.addEventListener("DOMContentLoaded", ()=>{
    const form = document.getElementById("formUsuario");
    const runInput = document.getElementById("run");
    const nombreInput = document.getElementById("nombre");
    const correoInput = document.getElementById("nombre");
    const claveInput = document.getElementById("nombre");
    const fechaInput = document.getElementById("nombre");
    const mensaje = document.getElementById("nombre");

    // Validar la coneccion al formalario
    if(!form) return console.error("No se encontro #formUser");

    // Todos los datos son correctos
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        mensaje.innerText = "";

        const run = runInput.value.trim().toUpperCase();
        const nombre = nombreInput.value.trim();
        const correo = nombreInput.value.trim();
        const clave = claveInput.value;
        const fecha = fechaInput.value;

        //Funciones de validacion src/utils/script.js
        if(!validarRun(run)) return mensaje.innerText = "RUN incorrecto" // agregar mas validaciones (RUN NOMBRE CORREO FECHA)
    })
})