// Inicializar página de éxito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaExito();
    configurarEventosExito();
    actualizarCarritoHeader(); // Actualizar header
});

/**
 * Inicializa la pagina de exito con los datos de la compra
 */
function inicializarPaginaExito() {
    // Obtener parametros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const ordenParam = urlParams.get('orden');
    const ultimaCompra = JSON.parse(localStorage.getItem('ultimaCompra'));
    
    // Si no hay datos de compra, redirigir al carrito
    if (!ultimaCompra && !ordenParam) {
        window.location.href = 'carrito.html';
        return;
    }

    // Mostrar los datos de la compra
    mostrarDatosCompra(ultimaCompra);
    renderizarProductosExito(ultimaCompra.productos);
    actualizarTotalExito(ultimaCompra.total);
}

/**
 * Muestra los datos de la compra en los formularios
 */
function mostrarDatosCompra(compra) {
    // Actualizar numeros de orden y compra
    document.getElementById('codigoOrden').textContent = compra.numeroOrden;
    document.getElementById('numeroCompra').textContent = compra.numeroOrden;

    // Mostrar datos del cliente
    document.getElementById('exitoNombre').value = compra.cliente.nombre;
    document.getElementById('exitoApellidos').value = compra.cliente.apellidos;
    document.getElementById('exitoCorreo').value = compra.cliente.correo;

    // Mostrar datos de direccion
    document.getElementById('exitoCalle').value = compra.direccion.calle;
    document.getElementById('exitoDepartamento').value = compra.direccion.departamento;
    document.getElementById('exitoRegion').value = compra.direccion.region;
    document.getElementById('exitoComuna').value = compra.direccion.comuna;
    document.getElementById('exitoIndicaciones').value = compra.direccion.indicaciones;
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
        const compra = JSON.parse(localStorage.getItem('ultimaCompra'));
        const fecha = new Date().toLocaleDateString('es-CL');
        
        const contenidoBoleta = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boleta de Compra - Orden ${compra.numeroOrden}</title>
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
        const compra = JSON.parse(localStorage.getItem('ultimaCompra'));
        const email = compra.cliente.correo;
        
        // Mostrar mensaje de carga
        const btnEnviar = document.getElementById('btnEnviarEmail');
        const textoOriginal = btnEnviar.innerHTML;
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