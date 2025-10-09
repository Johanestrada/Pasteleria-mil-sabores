document.addEventListener('DOMContentLoaded', function () {

    // ----------- REGISTRO -----------
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
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

        // Validación del formulario de registro
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

            // Validaciones
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) errores.push("El correo no tiene un formato válido.");
            if (telefono && !/^[0-9]{9}$/.test(telefono)) errores.push("El teléfono debe tener 9 dígitos numéricos.");
            if (password !== confirmPassword) errores.push("Las contraseñas no coinciden.");
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) errores.push("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
            if (!region) errores.push("Debes seleccionar una región.");
            if (!comuna) errores.push("Debes seleccionar una comuna.");
            if (!fechaNacimiento) errores.push("Debes ingresar tu fecha de nacimiento.");

            // Descuentos y promociones
            if (fechaNacimiento) {
                const hoy = new Date();
                const nacimiento = new Date(fechaNacimiento);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const mes = hoy.getMonth() - nacimiento.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

                if (edad > 50) promociones.push("🎉 ¡Felicidades! Recibes un <b>50% de descuento</b> por ser mayor de 50 años.");

                const esCumple = hoy.getDate() === nacimiento.getDate() && hoy.getMonth() === nacimiento.getMonth();
                if (esCumple && email.endsWith("@duocuc.cl")) promociones.push("¡Feliz cumpleaños! Como estudiante DUOC recibes una <b>torta gratis</b>.");
            }

            if (codigo === "FELICES50") promociones.push("Obtienes un <b>10% de descuento de por vida</b> con el código FELICES50.");

            // Mostrar mensajes
            if (errores.length > 0) {
                mensajeRegistro.innerHTML = `<span class="text-danger">${errores.join("<br>")}</span>`;
                return;
            }

            if (promociones.length > 0) {
                mensajeRegistro.innerHTML = promociones.join("<br>");
            } else {
                mensajeRegistro.innerHTML = `<span class="text-success">Registro exitoso! Guardando en base de datos...</span>`;

                // Configuración de Firebase
                const firebaseConfig = {
                    apiKey: "AIzaSyDcGOrjpPcVtxQutZ6R01AXhbkG9ixZitk",
                    authDomain: "tiendapasteleriamilsabor-195dc.firebaseapp.com",
                    projectId: "tiendapasteleriamilsabor-195dc",
                    storageBucket: "tiendapasteleriamilsabor-195dc.appspot.com",
                    messagingSenderId: "790229094599",
                    appId: "1:790229094599:web:7abf216f776053a6dbeee2",
                    measurementId: "G-0XMLPFPNM1"
                };

                try {
                    console.log('Registro: inicializando Firebase con config:', firebaseConfig);
                    if (!firebase.apps || firebase.apps.length === 0) {
                        firebase.initializeApp(firebaseConfig);
                    }

                    const db = firebase.firestore();

                    const userObj = {
                        nombre,
                        email,
                        telefono,
                        region,
                        comuna,
                        fechaNacimiento,
                        codigo,
                        createdAt: new Date()
                    };

                    db.collection('usuario').add(userObj)
                        .then(docRef => {
                            mensajeRegistro.innerHTML = `<span class="text-success">Registro exitoso! ID: ${docRef.id}</span>`;
                            formRegistro.reset();
                        })
                        .catch(err => {
                            console.error('Error guardando en Firestore:', err);
                            mensajeRegistro.innerHTML = `<span class="text-danger">Error al guardar en la base de datos.</span>`;
                        });

                } catch (err) {
                    console.error('Error inicializando Firebase o guardando:', err);
                    mensajeRegistro.innerHTML = `<span class="text-danger">Error en la inicialización de Firebase.</span>`;
                }
            }
        });
    }

    // ----------- LOGIN -----------
    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        const correoInput = document.getElementById("correoLogin");
        const claveInput = document.getElementById("claveLogin");
        const mensaje = document.getElementById("mensaje-login");

        const firebaseConfig = {
            apiKey: "AIzaSyBBT7jka7a-7v3vY19BlSajamiedLrBTN0",
            authDomain: "tiendanombretienda.firebaseapp.com",
            projectId: "tiendanombretienda",
            storageBucket: "tiendanombretienda.appspot.com",
            messagingSenderId: "408928911689",
            appId: "1:408928911689:web:d8b313c7e15fc528661a98",
            measurementId: "G-Y1DW47VEWZ"
        };

        if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);

        const auth = firebase.auth();
        const db = firebase.firestore();

        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            mensaje.innerText = "";
            const mensajeError = document.getElementById("mensaje-error");
            if (mensajeError) {
                mensajeError.innerText = "Mensaje de error";
            }

            const correo = correoInput.value.trim().toLowerCase();
            const clave = claveInput.value;

            if (!correo || !clave) {
                mensaje.style.color = "red";
                mensaje.innerText = "Debes completar correo y clave";
                return;
            }

            // Login administrador
            if (correo === "admin@duoc.cl") {
                try {
                    await auth.signInWithEmailAndPassword(correo, clave);
                    const usuario = { nombre: "Administrador", correo, rol: "admin" };
                    localStorage.setItem("usuario", JSON.stringify(usuario));

                    mensaje.style.color = "green";
                    mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
                    setTimeout(() => {
                        window.location.href = "perfilAdmin.html";
                    }, 1000);
                } catch (error) {
                    mensaje.style.color = "red";
                    mensaje.innerText = "Credenciales incorrectas para administrador";
                }
                return;
            }

            // Login cliente
            try {
                const query = await db.collection("usuario")
                    .where("correo", "==", correo)
                    .where("clave", "==", clave)
                    .get();

                if (!query.empty) {
                    const userData = query.docs[0].data();
                    const nombre = userData.nombre || correo;

                    const usuario = { nombre, correo, rol: "cliente" };
                    localStorage.setItem("usuario", JSON.stringify(usuario));

                    mensaje.style.color = "green";
                    mensaje.innerText = "Bienvenido cliente, redirigiendo...";
                    setTimeout(() => {
                        window.location.href = "perfilCliente.html";
                    }, 1000);
                } else {
                    mensaje.style.color = "red";
                    mensaje.innerText = "Correo o clave incorrectos";
                }
            } catch (error) {
                console.error("Error login cliente:", error);
                mensaje.style.color = "red";
                mensaje.innerText = "Error al verificar usuario";
            }
        });
    }

    // ----------- CONTACTO -----------
    const formContacto = document.getElementById('form-contacto');
    if (formContacto) {
        const mensajeContacto = document.getElementById('mensaje-contacto');

        formContacto.addEventListener('submit', function (e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const asunto = document.getElementById('asunto').value.trim();
            const mensaje = document.getElementById('mensaje').value.trim();
            const run = document.getElementById('run').value.trim();
            let errores = [];

            if (nombre.length < 3) errores.push("El nombre debe tener al menos 3 caracteres.");
            if (run.length < 3) errores.push("El run debe tener al menos 3 caracteres.");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) errores.push("El correo no tiene un formato válido.");
            if (asunto.length < 5) errores.push("El asunto debe tener al menos 5 caracteres.");
            if (mensaje.length < 10) errores.push("El mensaje debe tener al menos 10 caracteres.");

            if (errores.length > 0) {
                mensajeContacto.innerHTML = `<span class="text-danger">${errores.join("<br>")}</span>`;
            } else {
                mensajeContacto.innerHTML = `<span class="text-success">Mensaje enviado correctamente. ¡Gracias por contactarnos!</span>`;
                formContacto.reset();
            }
        });
    }

});
