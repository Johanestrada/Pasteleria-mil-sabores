// Configuración de Firebase (usar la del proyecto Pastelería Mil Sabores)
const firebaseConfig = {
    apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
    authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
    projectId: "tiendapasteleriamilsabor-a193d",
    storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
    messagingSenderId: "1022940675339",
    appId: "1:1022940675339:web:e347b3abbbe1e35615360e",
    measurementId: "G-WKZ1WX5H72"
};

// Inicializar Firebase (solo si no está ya inicializado)
if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Control de simulación de pagos: por defecto simula (útil para desarrollo).
// Para desactivar la simulación y forzar éxito pase `?simulatePayment=false` en la URL.
const SIMULAR_PAGO = (new URLSearchParams(window.location.search).get('simulatePayment') !== 'false');

// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Datos de regiones y comunas de Chile
const regionesComunas = {
    "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"],
    "Metropolitana": ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
    "O'Higgins": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
    "Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
    "Ñuble": ["Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Quirihue", "Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Ránquil", "Treguaco", "San Carlos", "Coihueco", "Ñiquén", "San Fabián", "San Nicolás"],
    "Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualpén", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío", "Lebú", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa"],
    "Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
    "Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
    "Aysén": ["Coihaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
    "Magallanes": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
};

// Inicializar checkout cuando el DOM esté listo (robusto si el script se carga al final)
function _initCheckoutOnce() {
    inicializarCheckout();
    configurarEventosCheckout();
    cargarRegiones(); // Cargar las regiones al iniciar
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initCheckoutOnce);
} else {
    // Si el DOM ya está listo (script incluido al final), ejecutar inmediatamente
    _initCheckoutOnce();
}

/**
 * Carga las regiones en el select correspondiente
 */
function cargarRegiones() {
    const selectRegion = document.getElementById('region');
    
    // Ordenar regiones alfabéticamente
    const regionesOrdenadas = Object.keys(regionesComunas).sort();
    
    regionesOrdenadas.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        selectRegion.appendChild(option);
    });
}

/**
 * Carga las comunas según la región seleccionada
 */
function cargarComunas(region) {
    const selectComuna = document.getElementById('comuna');
    const comunas = regionesComunas[region] || [];
    
    // Limpiar select de comunas
    selectComuna.innerHTML = '<option value="">Selecciona una comuna</option>';
    
    // Ordenar comunas alfabéticamente
    comunas.sort().forEach(comuna => {
        const option = document.createElement('option');
        option.value = comuna;
        option.textContent = comuna;
        selectComuna.appendChild(option);
    });
    
    // Habilitar el select de comunas
    selectComuna.disabled = false;
}

/**
 * Inicializa la interfaz del checkout
 */
function inicializarCheckout() {
    actualizarCarritoHeader();
    renderizarProductosCheckout();
    actualizarTotales();
}

/**
 * Renderiza los productos en la tabla del checkout
 */
function renderizarProductosCheckout() {
    const tbody = document.getElementById('tablaCheckoutBody');
    
    if (carrito.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="carrito-vacio">
                    <div class="icono">🛒</div>
                    <h3>No hay productos en el carrito</h3>
                    <a href="carrito.html" class="btn-ir-catalogo">Volver al Carrito</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = carrito.map(producto => `
        <tr>
            <td>
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="imagen-tabla"
                     onerror="this.src='https://via.placeholder.com/100x100/cccccc/969696?text=Imagen'">
            </td>
            <td>${producto.nombre}</td>
            <td>$${producto.precio?.toLocaleString('es-CL')}</td>
            <td>${producto.cantidad || 1}</td>
            <td>$${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}</td>
        </tr>
    `).join('');
}

/**
 * Actualiza los totales en la interfaz
 */
function actualizarTotales() {
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    
    document.getElementById('totalPagar').textContent = total.toLocaleString('es-CL');
    document.getElementById('montoPagar').textContent = total.toLocaleString('es-CL');
}

/**
 * Actualiza el header del carrito
 */
function actualizarCarritoHeader() {
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    // Actualizar solo si el elemento existe en la página
    const el = document.querySelector('.carrito-total');
    if (el) el.textContent = total.toLocaleString('es-CL');
}

/**
 * Procesa el pago y guarda la compra en Firestore
 */
async function procesarPago() {
    // Validar que hay productos en el carrito
    if (carrito.length === 0) {
        alert('No hay productos en el carrito');
        return;
    }

    // Validar formularios
    if (!validarFormularios()) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    try {
        // Obtener datos del formulario
        const datosCliente = obtenerDatosCliente();
        const datosDireccion = obtenerDatosDireccion();
        const total = carrito.reduce((sum, producto) => sum + ((producto.precio || 0) * (producto.cantidad || 1)), 0);

        // Crear objeto de compra
        const compra = {
            // Usar serverTimestamp cuando sea posible para compatibilidad con queries por fecha
            fecha: (firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
            cliente: datosCliente,
            direccion: datosDireccion,
            productos: [...carrito], // Copia del carrito
            total: total,
            estado: 'pendiente',
            numeroOrden: generarNumeroOrden()
        };

        // Guardar en Firestore
        console.log('Guardando compra en Firestore (proyecto):', firebase.app().options.projectId, compra);
        const docRef = await db.collection('compras').add(compra);
        console.log('Compra guardada con ID:', docRef.id);
        
        // Procesamiento de pago (simulado en desarrollo)
        let pagoExitoso;
        if (SIMULAR_PAGO) {
            pagoExitoso = Math.random() > 0.5; // comportamiento antiguo, aleatorio
        } else {
            // En entorno de pruebas/producción forzamos éxito para evitar falsos negativos
            pagoExitoso = true;
        }
        console.log('Proceso de pago - simulatePayment=', SIMULAR_PAGO, 'resultado=', pagoExitoso);

        if (pagoExitoso) {
            // Actualizar estado en Firestore
            await db.collection('compras').doc(docRef.id).update({
                estado: 'completada'
            });
            
            // Limpiar carrito y redirigir a éxito
            localStorage.removeItem('carrito');
            localStorage.setItem('ultimaCompra', JSON.stringify({
                ...compra,
                id: docRef.id
            }));
            window.location.href = `compraExitosa.html?orden=${compra.numeroOrden}`;
        } else {
            // Actualizar estado en Firestore
            await db.collection('compras').doc(docRef.id).update({
                estado: 'error_pago'
            });
            
            // Guardar compra para mostrar detalles en pantalla de error y ofrecer reintento
            localStorage.setItem('ultimaCompra', JSON.stringify({
                ...compra,
                id: docRef.id
            }));
            console.warn('Pago fallido (simulado). ID compra:', docRef.id);

            // Mostrar modal de error con opción de reintentar
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: `No se pudo realizar el pago ${compra.numeroOrden}`,
                    html: `Detalle de compra<br><strong>Total:</strong> $ ${total.toLocaleString('es-CL')}`,
                    showCancelButton: true,
                    confirmButtonText: 'Volver a intentar',
                    cancelButtonText: 'Cancelar'
                }).then(result => {
                    if (result.isConfirmed) {
                        // Intentar el pago de nuevo (vuelve a llamar al procesamiento)
                        procesarPago();
                    } else {
                        // Redirigir a una página de error para mostrar detalles
                        window.location.href = `errorPago.html?orden=${compra.numeroOrden}`;
                    }
                });
            } else {
                // Si no hay SweetAlert, usar redirect directo
                window.location.href = `errorPago.html?orden=${compra.numeroOrden}`;
            }
        }

    } catch (error) {
        console.error('Error procesando la compra:', error);
        alert('Error al procesar la compra. Intenta nuevamente.');
    }
}

/**
 * Valida los formularios de cliente y dirección
 */
function validarFormularios() {
    const formCliente = document.getElementById('formCliente');
    const formDireccion = document.getElementById('formDireccion');
    
    return formCliente.checkValidity() && formDireccion.checkValidity();
}

/**
 * Obtiene los datos del cliente del formulario
 */
function obtenerDatosCliente() {
    return {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellidos').value,
        correo: document.getElementById('correo').value
    };
}

/**
 * Obtiene los datos de dirección del formulario
 */
function obtenerDatosDireccion() {
    return {
        calle: document.getElementById('calle').value,
        departamento: document.getElementById('departamento').value || '',
        region: document.getElementById('region').value,
        comuna: document.getElementById('comuna').value,
        indicaciones: document.getElementById('indicaciones').value || ''
    };
}

/**
 * Genera un número de orden único
 */
function generarNumeroOrden() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORDEN${timestamp}${random}`;
}

/**
 * Configura los eventos del checkout
 */
function configurarEventosCheckout() {
    const btnPagar = document.getElementById('btnPagarAhora');
    if (btnPagar) btnPagar.addEventListener('click', procesarPago);

    // Evento para cargar comunas cuando se selecciona una región
    const selectRegion = document.getElementById('region');
    if (selectRegion) {
        selectRegion.addEventListener('change', function() {
            if (this.value) {
                cargarComunas(this.value);
            } else {
                // Si no hay región seleccionada, deshabilitar comuna
                const selectComuna = document.getElementById('comuna');
                if (selectComuna) {
                    selectComuna.innerHTML = '<option value="">Primero selecciona una región</option>';
                    selectComuna.disabled = true;
                }
            }
        });
    }

    // Validación en tiempo real
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validarCampo(this);
        });
    });
}

/**
 * Valida un campo individual
 */
function validarCampo(campo) {
    if (!campo.value.trim()) {
        campo.style.borderColor = '#dc3545';
    } else {
        campo.style.borderColor = '#28a745';
    }
}