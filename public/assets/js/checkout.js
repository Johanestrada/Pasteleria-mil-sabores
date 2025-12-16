document.addEventListener("DOMContentLoaded", async () => {
    // 1. Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
        authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
        projectId: "tiendapasteleriamilsabor-a193d",
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // 2. Obtener elementos del DOM
    const tablaCheckoutBody = document.getElementById('tablaCheckoutBody');
    const totalPagarSpan = document.getElementById('totalPagar');
    const montoPagarSpan = document.getElementById('montoPagar');

    // Campos de cliente
    const nombreInput = document.getElementById('nombre');
    const apellidosInput = document.getElementById('apellidos');
    const correoInput = document.getElementById('correo');
    
    // Campos de dirección
    const calleInput = document.getElementById('calle');
    const deptoInput = document.getElementById('departamento');
    const regionInput = document.getElementById('region');
    const comunaInput = document.getElementById('comuna');
    const indicacionesInput = document.getElementById('indicaciones');

    // 3. Cargar datos del usuario y del carrito
    const usuarioStr = localStorage.getItem("usuario");
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    if (!usuarioStr) {
        console.error("No hay usuario logueado.");
        // La redirección ya se hace en el HTML, así que solo retornamos.
        return;
    }
    const usuario = JSON.parse(usuarioStr);

    // Lógica para regiones y comunas de Chile (todas las 16 regiones)
    const comunasPorRegion = {
        arioca: {
            nombre: "Arica y Parinacota",
            comunas: ["Arica", "Camarones", "Putre", "General Lagos"]
        },
        tarapaca: {
            nombre: "Tarapacá",
            comunas: ["Iquique", "Alto Hospicio", "Camiña", "Colchane", "Huara", "Pica", "Pozo Almonte"]
        },
        antofagasta: {
            nombre: "Antofagasta",
            comunas: ["Antofagasta", "Calama", "San Pedro de Atacama", "Tocopilla", "María Elena", "Mejillones", "Taltal"]
        },
        atacama: {
            nombre: "Atacama",
            comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
        },
        coquimbo: {
            nombre: "Coquimbo",
            comunas: ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Combarbala", "Monte Patria", "Punitaqui", "Río Hurtado"]
        },
        valparaiso: {
            nombre: "Valparaíso",
            comunas: ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana", "Limache", "Olmué", "Calle Larga", "Rinconada", "La Ligua", "Petorca", "Papudo", "Zapallar", "Cartagena", "El Quisco", "Algarrobo", "San Antonio", "Santo Domingo", "Casablanca", "Juan Fernández"]
        },
        metropolitana: {
            nombre: "Metropolitana de Santiago",
            comunas: ["Santiago", "Puente Alto", "Maipú", "Las Condes", "Ñuñoa", "Providencia", "La Florida", "La Reina", "Peñalolén", "La Cisterna", "La Granja", "Renca", "Pudahuel", "Huechuraba", "Vitacura", "Lo Barnechea", "Colina", "Lampa", "Tiltil", "San Bernardo", "Pirque", "San José de Maipo", "Buin", "Paine"]
        },
        ohiggins: {
            nombre: "Libertador General Bernardo O'Higgins",
            comunas: ["Rancagua", "Machalí", "Graneros", "Doñihue", "Requínoa", "Rengo", "Olivar", "Pichidegua", "San Vicente de Tagua Tagua", "Peumo", "Coltauco", "Santa Cruz", "Nancagua", "Chépica", "Palmilla", "San Fernando", "Peralillo", "Pichilemu", "Navidad", "Litueche", "La Estrella", "Marchihue"]
        },
        maule: {
            nombre: "Maule",
            comunas: ["Talca", "San Clemente", "Macoleta", "Pencahue", "Río Claro", "San Rafael", "Curicó", "Teno", "Rauco", "Licantén", "Molina", "Romeral", "Longaví", "Retiro", "Linares", "Parral", "Cauquenes", "Chanco", "Pelluhue", "Constitución"]
        },
        nable: {
            nombre: "Ñuble",
            comunas: ["Chillán", "Chillán Viejo", "Ñiquén", "San Ignacio", "Pemuco", "Yungay", "Coihueco", "Ranquil", "Bulnes", "Quillón", "San Carlos", "Ránquil", "Portezuelo", "Treguaco", "Pinto", "Cobquecura", "Quirihue", "Ninhue"]
        },
        biobio: {
            nombre: "Bío-Bío",
            comunas: ["Concepción", "Talcahuano", "Chiguayante", "Los Ángeles", "Arauco", "Curanilahue", "Lebu", "Cañete", "Contulmo", "Tirúa", "Santa Bárbara", "Nacimiento", "Lota", "Coronel", "Hualpén", "Penco", "Tomé"]
        },
        araucania: {
            nombre: "La Araucanía",
            comunas: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Curarrehue", "Pitrufquén", "Manzanares", "Gorbea", "Loncoche", "Ercilla", "Collipulli", "Lonquimay", "Los Sauces", "Purén", "Victoria", "Traiguén", "Nueva Imperial", "Carahue", "Cunco", "Freire"]
        },
        losrios: {
            nombre: "Los Ríos",
            comunas: ["Valdivia", "Corral", "Lachon", "Máfil", "Mariquina", "Paillaco", "Pangipulli", "La Unión", "Futrono", "Río Bueno", "Lago Ranco"]
        },
        loslagos: {
            nombre: "Los Lagos",
            comunas: ["Puerto Montt", "Puerto Varas", "Los Muermos", "Llanquihue", "Frutillar", "Puyehue", "Osorno", "Purranque", "Río Negro", "San Juan de la Costa", "San Pablo", "Maullín", "Calbuco", "Cochamó", "Leptepu", "Chonchi", "Dalcahue", "Curaco de Vélez", "Quinchao", "Quellón", "Achao", "Castro"]
        },
        aysen: {
            nombre: "Aysén del General Carlos Ibáñez del Campo",
            comunas: ["Coyhaique", "Lago Verde", "Aysén", "Guaitecas", "Cisnes", "Puerto Aysén", "Tortel", "Villa O'Higgins"]
        },
        magallanes: {
            nombre: "Magallanes y de la Antártica Chilena",
            comunas: ["Punta Arenas", "Puerto Natales", "Río Verde", "Laguna Blanca", "San Gregorio", "Timaukel"]
        }
    };

    // Poblar regiones
    if (regionInput) {
        regionInput.innerHTML = '<option value="">Seleccione una región</option>';
        Object.keys(comunasPorRegion).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            const nombreRegion = comunasPorRegion[key].nombre;
            option.textContent = nombreRegion;
            regionInput.appendChild(option);
        });

        // Evento para cambiar comunas al seleccionar región
        regionInput.addEventListener('change', () => {
            const regionSeleccionada = regionInput.value;
            if (comunaInput) {
                comunaInput.innerHTML = '<option value="">Seleccione una comuna</option>';
                comunaInput.disabled = true;

                if (regionSeleccionada && comunasPorRegion[regionSeleccionada]) {
                    comunasPorRegion[regionSeleccionada].comunas.forEach(comuna => {
                        const option = document.createElement('option');
                        option.value = comuna;
                        option.textContent = comuna;
                        comunaInput.appendChild(option);
                    });
                    comunaInput.disabled = false;
                }
            }
        });
    }

    // 4. Cargar datos del perfil del usuario desde Firestore
    if (usuario && usuario.uid) {
        try {
            const userDoc = await db.collection("usuario").doc(usuario.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                
                // Rellenar campos de cliente
                if (nombreInput) nombreInput.value = data.nombre || '';
                if (apellidosInput) apellidosInput.value = data.apellido || '';
                if (correoInput) correoInput.value = data.email || usuario.correo || '';

                // Rellenar campos de dirección si existen
                if (data.direccion) {
                    if (calleInput) calleInput.value = data.direccion.calle || '';
                    if (deptoInput) deptoInput.value = data.direccion.depto || '';
                    
                    if (regionInput && data.direccion.region) {
                        regionInput.value = data.direccion.region;
                        regionInput.dispatchEvent(new Event('change')); // Poblar comunas
                    }
                    if (comunaInput && data.direccion.comuna) {
                        // Esperar un poco para que las comunas se carguen
                        setTimeout(() => {
                            comunaInput.value = data.direccion.comuna;
                        }, 100); 
                    }
                }
            } else {
                console.log("No se encontró información de perfil adicional en Firestore.");
                // Rellenar con datos básicos si no hay perfil en Firestore
                if (nombreInput) nombreInput.value = usuario.nombre || '';
                if (correoInput) correoInput.value = usuario.correo || '';
            }
        } catch (error) {
            console.error("Error al cargar datos del usuario desde Firestore:", error);
        }
    }

    // 5. Renderizar carrito y calcular total
    let total = 0;
    if (carrito.length === 0) {
        if (tablaCheckoutBody) tablaCheckoutBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Tu carrito está vacío. <a href="catalogo.html">Ir a comprar</a></td></tr>';
        const btnPagar = document.getElementById('btnPagarAhora');
        if (btnPagar) btnPagar.disabled = true;
    } else {
        if (tablaCheckoutBody) tablaCheckoutBody.innerHTML = '';
        carrito.forEach(producto => {
            const subtotal = (producto.precio || 0) * (producto.cantidad || 1);
            total += subtotal;
            const fila = `
                <tr>
                    <td><img src="${producto.imagen}" alt="${producto.nombre}" width="60"></td>
                    <td>${producto.nombre}</td>
                    <td>$${(producto.precio || 0).toLocaleString('es-CL')}</td>
                    <td>${producto.cantidad || 1}</td>
                    <td>$${subtotal.toLocaleString('es-CL')}</td>
                </tr>
            `;
            if (tablaCheckoutBody) tablaCheckoutBody.innerHTML += fila;
        });
    }

    // Actualizar totales en la página
    if (totalPagarSpan) totalPagarSpan.textContent = total.toLocaleString('es-CL');
    if (montoPagarSpan) montoPagarSpan.textContent = total.toLocaleString('es-CL');

    // 6. Lógica del botón "Pagar Ahora"
    const btnPagarAhora = document.getElementById('btnPagarAhora');
    if (btnPagarAhora) {
        btnPagarAhora.addEventListener('click', async () => {
            // Deshabilitar botón para evitar múltiples clics
            const originalButtonHTML = btnPagarAhora.innerHTML;
            btnPagarAhora.disabled = true;
            btnPagarAhora.textContent = 'Procesando...';

            // (Removed temporary session debug instrumentation in production)

            // Validar campos requeridos
            const camposRequeridos = [nombreInput, apellidosInput, correoInput, calleInput, regionInput, comunaInput];
            for (const campo of camposRequeridos) {
                if (campo && !campo.value.trim()) {
                    const label = document.querySelector(`label[for="${campo.id}"]`);
                    const nombreCampo = label ? label.textContent.replace('*', '').trim() : 'un campo requerido';
                    alert(`Por favor, completa el campo "${nombreCampo}".`);
                    
                    btnPagarAhora.disabled = false;
                    btnPagarAhora.innerHTML = originalButtonHTML;
                    return;
                }
            }

            // Recolectar datos para la compra
            const datosCompra = {
                usuarioId: usuario.uid,
                cliente: {
                    nombre: nombreInput.value.trim(),
                    apellidos: apellidosInput.value.trim(),
                    correo: correoInput.value.trim()
                },
                direccion: {
                    calle: calleInput.value.trim(),
                    departamento: deptoInput.value.trim(),
                    region: regionInput.options[regionInput.selectedIndex].text,
                    comuna: comunaInput.value,
                    indicaciones: indicacionesInput.value.trim()
                },
                productos: carrito,
                total: total,
                fecha: new Date(), // Firestore lo convertirá a su formato Timestamp
                estado: 'En preparación'
            };

            // Simulación de pago (80% de probabilidad de éxito para facilitar pruebas)
            const pagoExitoso = Math.random() < 0.8;

            if (pagoExitoso) {
                try {
                    const docRef = await db.collection('compras').add(datosCompra);
                    console.log("Compra guardada con ID: ", docRef.id);

                    localStorage.setItem('ultimaCompra', JSON.stringify({ ...datosCompra, numeroOrden: docRef.id }));
                    localStorage.removeItem('carrito');

                    // Debug flag removed: no session debug set here in production

                    window.location.href = `compraExitosa.html?orden=${docRef.id}`;
                } catch (error) {
                    console.error("Error al guardar la compra: ", error);
                    alert('Hubo un error al procesar tu compra. Por favor, inténtalo de nuevo.');
                    btnPagarAhora.disabled = false;
                    btnPagarAhora.innerHTML = originalButtonHTML;
                }
            } else {
                console.warn("Simulación de pago fallida.");
                localStorage.setItem('ultimaCompra', JSON.stringify({ ...datosCompra, numeroOrden: 'pago-fallido-' + Date.now() }));
                window.location.href = 'errorPago.html';
            }
        });
    }
});
