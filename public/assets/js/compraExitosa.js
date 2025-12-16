// Inicializar página de éxito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    await inicializarPaginaExito();
    configurarEventosExito();
    actualizarCarritoHeader(); // Actualizar header
});

/**
 * Inicializa la pagina de exito con los datos de la compra
 */
async function inicializarPaginaExito() {
    // Session debug instrumentation removed — ensure any leftover flags/logs are cleared so users don't see debug UI
    try {
        localStorage.removeItem('sessionDebugActive');
        localStorage.removeItem('sessionDebugLogs');
        localStorage.removeItem('sessionDebugSnapshot');
    } catch (e) {
        // ignore any storage errors
    }

    // Obtener parametros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const ordenParam = urlParams.get('orden');
    let compra = null;

    // Intentar leer de localStorage primero
    try {
        compra = JSON.parse(localStorage.getItem('ultimaCompra')) || null;
    } catch (err) {
        compra = null;
    }

    // Si no hay datos de localStorage pero sí viene un id en la URL, intentar cargar desde Firestore
    if (!compra && ordenParam) {
        try {
            // Inicializar firebase si no está
            const firebaseConfig = {
                apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
                authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
                projectId: "tiendapasteleriamilsabor-a193d",
            };
            if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
            const db = firebase.firestore();

            const doc = await db.collection('compras').doc(ordenParam).get();
            if (!doc.exists) {
                alert('No se encontró la orden solicitada.');
                window.location.href = 'carrito.html';
                return;
            }

            compra = doc.data();
            compra.numeroOrden = doc.id; // usar el id como número de orden si no existe en el documento

            // Guardar una copia simplificada en localStorage para compatibilidad con otras funciones
            try {
                const compraParaStore = {
                    numeroOrden: compra.numeroOrden,
                    cliente: compra.cliente || compra.clienteInfo || {},
                    direccion: compra.direccion || compra.shippingAddress || {},
                    productos: Array.isArray(compra.productos) ? compra.productos : (compra.items || []),
                    total: compra.total || 0,
                    fecha: compra.fecha && compra.fecha.toDate ? compra.fecha.toDate().toString() : (compra.fecha ? String(compra.fecha) : '')
                };
                localStorage.setItem('ultimaCompra', JSON.stringify(compraParaStore));
            } catch (errStore) {
                console.warn('No se pudo guardar ultimaCompra en localStorage:', errStore);
            }

        } catch (err) {
            console.error('Error al cargar la orden desde Firestore:', err);
            alert('Error al cargar la orden. Revisa la consola.');
            return;
        }
    }

    // Si al final no hay compra, redirigir
    if (!compra) {
        window.location.href = 'carrito.html';
        return;
    }

    // Exponer globalmente la compra actual para otras funciones (imprimir/enviar)
    window.currentCompra = compra;

    // Mostrar los datos de la compra
    mostrarDatosCompra(compra);
    renderizarProductosExito(compra.productos || []);
    actualizarTotalExito(compra.total || 0);
}

/**
 * Muestra los datos de la compra en los formularios
 */
function mostrarDatosCompra(compra) {
    // Actualizar numeros de orden y compra (comprobar existencia para evitar errores)
    const codigoEl = document.getElementById('codigoOrden');
    const numeroEl = document.getElementById('numeroCompra');
    const numeroOrdenText = compra.numeroOrden || compra.numero || compra.id || '—';
    if (codigoEl) codigoEl.textContent = 'ORDEN: ' + numeroOrdenText;
    if (numeroEl) numeroEl.textContent = numeroOrdenText;

    // Mostrar datos del cliente con seguridad
    const cliente = compra.cliente || compra.clienteInfo || {};
    const nombreVal = cliente.nombre || cliente.nombreCliente || '';
    const apellidosVal = cliente.apellidos || cliente.apellido || cliente.apellidosCliente || '';
    const correoVal = cliente.correo || cliente.email || cliente.correoCliente || '';
    const elNombre = document.getElementById('exitoNombre');
    const elApellidos = document.getElementById('exitoApellidos');
    const elCorreo = document.getElementById('exitoCorreo');
    if (elNombre) elNombre.value = nombreVal;
    if (elApellidos) elApellidos.value = apellidosVal;
    if (elCorreo) elCorreo.value = correoVal;

    // Mostrar datos de direccion con varios fallback de propiedades
    const direccion = compra.direccion || compra.shippingAddress || compra.address || {};
    const calle = direccion.calle || direccion.street || direccion.direccion || '';
    const departamento = direccion.departamento || direccion.depto || direccion.numero || '';
    const region = direccion.region || direccion.regionName || '';
    const comuna = direccion.comuna || direccion.commune || '';
    const indicaciones = direccion.indicaciones || direccion.notes || '';

    const elCalle = document.getElementById('exitoCalle');
    const elDepto = document.getElementById('exitoDepartamento');
    const elRegion = document.getElementById('exitoRegion');
    const elComuna = document.getElementById('exitoComuna');
    const elIndic = document.getElementById('exitoIndicaciones');

    if (elCalle) elCalle.value = calle;
    if (elDepto) elDepto.value = departamento;
    if (elRegion) elRegion.value = region;
    if (elComuna) elComuna.value = comuna;
    if (elIndic) elIndic.value = indicaciones;
}

/**
 * Renderiza los productos en la tabla de exito
 */
function renderizarProductosExito(productos) {
    const tbody = document.getElementById('tablaExitoBody');
    
    // Generar filas de la tabla con los productos
    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="producto-imagen-checkout"
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
 * Actualiza el total en la pagina de exito
 */
function actualizarTotalExito(total) {
    document.getElementById('totalPagado').textContent = total.toLocaleString('es-CL');
}

/**
 * Actualiza el header del carrito (vacio despues de compra exitosa)
 */
function actualizarCarritoHeader() {
    const carritoTotalElement = document.querySelector('.carrito-total');
    if (carritoTotalElement) {
        carritoTotalElement.textContent = '0';
    }
}

/**
 * Genera e imprime la boleta en PDF
 */
function imprimirBoletaPDF() {
    try {
        // Crear contenido HTML para la boleta
        const compra = window.currentCompra || JSON.parse(localStorage.getItem('ultimaCompra'));
        const fecha = new Date().toLocaleDateString('es-CL');
        
        const contenidoBoleta = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boleta de Compra - Orden ${compra?.numeroOrden || '—'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .info-cliente { margin-bottom: 20px; }
                    .tabla-productos { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .tabla-productos th, .tabla-productos td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .tabla-productos th { background-color: #f2f2f2; }
                    .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>BOLETA ELECTRONICA</h1>
                    <p>Orden: ${compra.numeroOrden} | Fecha: ${fecha}</p>
                </div>
                
                <div class="info-cliente">
                    <h3>Datos del Cliente</h3>
                    <p><strong>Nombre:</strong> ${compra.cliente.nombre} ${compra.cliente.apellidos}</p>
                    <p><strong>Email:</strong> ${compra.cliente.correo}</p>
                    <p><strong>Direccion:</strong> ${compra.direccion.calle}, ${compra.direccion.departamento}</p>
                    <p><strong>Comuna:</strong> ${compra.direccion.comuna}, ${compra.direccion.region}</p>
                    ${compra.direccion.indicaciones ? `<p><strong>Indicaciones:</strong> ${compra.direccion.indicaciones}</p>` : ''}
                </div>
                
                <table class="tabla-productos">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compra.productos.map(producto => `
                            <tr>
                                <td>${producto.nombre}</td>
                                <td>$${producto.precio?.toLocaleString('es-CL')}</td>
                                <td>${producto.cantidad || 1}</td>
                                <td>$${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>TOTAL: $${compra.total.toLocaleString('es-CL')}</p>
                </div>
                
                <div class="footer">
                    <p>¡Gracias por su compra!</p>
                    <p>Este documento es una boleta electronica generada automaticamente</p>
                </div>
            </body>
            </html>
        `;

        // Crear ventana de impresion
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(contenidoBoleta);
        ventanaImpresion.document.close();
        
        // Esperar a que cargue el contenido y luego imprimir
        ventanaImpresion.onload = function() {
            ventanaImpresion.print();
            // Cerrar ventana despues de imprimir
            setTimeout(() => {
                ventanaImpresion.close();
            }, 500);
        };

    } catch (error) {
        console.error('Error al generar la boleta:', error);
        alert('Error al generar la boleta. Por favor, intente nuevamente.');
    }
}

/**
 * Simula el envio de la boleta por email
 */
function enviarBoletaEmail() {
    try {
        const compra = window.currentCompra || JSON.parse(localStorage.getItem('ultimaCompra'));
        const email = (compra && (compra.cliente && (compra.cliente.correo || compra.cliente.email))) || '';
        
        // Mostrar mensaje de carga
        const btnEnviar = document.getElementById('btnEnviarEmail');
        const textoOriginal = btnEnviar ? btnEnviar.innerHTML : 'Enviando...';
        btnEnviar.innerHTML = 'Enviando...';
        btnEnviar.disabled = true;
        
        // Simular envio de email
        setTimeout(() => {
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.disabled = false;
            
            // Mostrar confirmacion
            Swal.fire({
                icon: 'success',
                title: '¡Boleta enviada!',
                text: `La boleta ha sido enviada exitosamente a ${email}`,
                confirmButtonText: 'Aceptar',
                timer: 3000
            });
            
        }, 2000);
        
    } catch (error) {
        console.error('Error al enviar la boleta:', error);
        
        // Restaurar boton en caso de error
        const btnEnviar = document.getElementById('btnEnviarEmail');
        btnEnviar.innerHTML = 'Enviar Boleta';
        btnEnviar.disabled = false;
        
        Swal.fire({
            icon: 'error',
            title: 'Error al enviar',
            text: 'No se pudo enviar la boleta. Por favor, intente nuevamente.',
            confirmButtonText: 'Aceptar'
        });
    }
}

/**
 * Configura los eventos de la pagina de exito
 */
function configurarEventosExito() {
    // Configurar boton de imprimir
    const btnImprimir = document.getElementById('btnImprimirPDF');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', imprimirBoletaPDF);
    } else {
        console.error('Boton de imprimir no encontrado');
    }
    
    // Configurar boton de enviar
    const btnEnviar = document.getElementById('btnEnviarEmail');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', enviarBoletaEmail);
    } else {
        console.error('Boton de enviar no encontrado');
    }
    
    // Tambien agregar eventos para los botones si existen con diferentes IDs
    const btnImprimirAlternativo = document.getElementById('btnImprimirBoleta');
    if (btnImprimirAlternativo) {
        btnImprimirAlternativo.addEventListener('click', imprimirBoletaPDF);
    }
    
    const btnEnviarAlternativo = document.getElementById('btnEnviarBoleta');
    if (btnEnviarAlternativo) {
        btnEnviarAlternativo.addEventListener('click', enviarBoletaEmail);
    }
}