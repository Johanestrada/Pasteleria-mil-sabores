// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
  authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
  projectId: "tiendapasteleriamilsabor-a193d",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let productosOferta = [];

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Detectar si estamos en la página del carrito (elementos específicos existen)
    const hasCartTable = !!document.getElementById('tablaCarritoBody');
    const hasTotalCarrito = !!document.getElementById('totalCarrito');

    if (hasCartTable || hasTotalCarrito) {
        inicializarCarrito();
        // Cargar ofertas solo en la página del carrito (evita duplicar en ofertas.html)
        cargarProductosOferta();
        configurarEventos();
    } else {
        // Si no estamos en la página de carrito, solo actualizar el contador del header
        actualizarCarritoHeader();
    }
});

/**
 * Inicializa la interfaz del carrito
 */
function inicializarCarrito() {
    actualizarCarritoHeader();
    renderizarCarrito();
    calcularTotal();
}

/**
 * Carga productos en oferta desde Firestore
 */
async function cargarProductosOferta() {
    try {
            // Consultar solo productos que tengan precioAnterior mayor a 0 (ofertas)
            const snapshot = await db.collection("producto").where('precioAnterior', '>', 0).get();
            productosOferta = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Los documentos ya vienen filtrados por la consulta, pero aseguramos formato
            const productosConOferta = productosOferta.filter(producto => producto.precioAnterior && Number(producto.precioAnterior) > 0);
            renderizarProductosOferta(productosConOferta);
    } catch (error) {
        console.error("Error cargando productos en oferta:", error);
    }
}

/**
 * Renderiza los productos en oferta
 */
function renderizarProductosOferta(productos) {
    const contenedor = document.getElementById('productosOferta');
    
    if (productos.length === 0) {
        contenedor.innerHTML = '<p>No hay productos en oferta en este momento.</p>';
        return;
    }

    contenedor.innerHTML = productos.map(producto => `
        <div class="producto-card">
            <img src="${producto.imagen}" 
                 alt="${producto.nombre}" 
                 class="producto-imagen"
                 onerror="this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'">
            <div class="producto-info">
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <div class="precios-oferta">
                    <span class="precio-anterior">$${producto.precioAnterior?.toLocaleString('es-CL')}</span>
                    <span class="precio-actual">$${producto.precio?.toLocaleString('es-CL')}</span>
                </div>
                <p class="stock-disponible">Stock: ${producto.stock || 10}</p>
                <button class="btn-agregar-oferta" data-id="${producto.id}">
                    Añadir
                </button>
            </div>
        </div>
    `).join('');

    // Agregar eventos a los botones de añadir
    document.querySelectorAll('.btn-agregar-oferta').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            agregarProductoAlCarrito(productId);
        });
    });
}

/**
 * Renderiza los productos en el carrito
 */
function renderizarCarrito() {
    const tbody = document.getElementById('tablaCarritoBody');
    if (!tbody) return; // Página no tiene tabla de carrito

    if (carrito.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="carrito-vacio">
                    <div class="icono">🛒</div>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega algunos productos para continuar</p>
                    <a href="catalogo.html" class="btn-ir-catalogo">Ir al Catálogo</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = carrito.map((producto, index) => `
        <tr>
            <td data-label="Imagen">
                <img src="${producto.imagen}" 
                     alt="${producto.nombre}" 
                     class="imagen-tabla"
                     onerror="this.src='https://via.placeholder.com/100x100/cccccc/969696?text=Imagen'">
            </td>
            <td data-label="Nombre">${producto.nombre}</td>
            <td data-label="Precio">${producto.precio?.toLocaleString('es-CL')}</td>
            <td data-label="Cantidad">
                <div class="controles-cantidad">
                    <button class="btn-cantidad" onclick="disminuirCantidad(${index})">-</button>
                    <span class="cantidad-actual">${producto.cantidad || 1}</span>
                    <button class="btn-cantidad" onclick="aumentarCantidad(${index})">+</button>
                </div>
            </td>
            <td data-label="Subtotal">${((producto.precio || 0) * (producto.cantidad || 1)).toLocaleString('es-CL')}</td>
            <td data-label="Acciones">
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">
                    Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Agrega un producto al carrito
 */
function agregarProductoAlCarrito(productId) {
    const producto = productosOferta.find(p => p.id === productId);
    
    if (producto) {
        // Verificar stock antes de agregar
        if (producto.stock <= 0) {
            mostrarNotificacion('Producto sin stock disponible', 'error');
            return;
        }
        
        // Verificar si el producto ya está en el carrito
        const productoExistente = carrito.find(item => item.id === productId);
        
        if (productoExistente) {
            productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
        } else {
            carrito.push({
                ...producto,
                cantidad: 1
            });
        }
        
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();
        
        // ACTUALIZAR STOCK EN FIREBASE - AGREGAR ESTA LÍNEA
        actualizarStockFirebase(productId, 1);
        
        mostrarNotificacion(`"${producto.nombre}" agregado al carrito`);
    }
}

/**
 * Actualizar stock en Firebase cuando se agrega al carrito
 */
async function actualizarStockFirebase(productId, cantidad) {
    try {
        const productoRef = db.collection("producto").doc(productId);
        const productoDoc = await productoRef.get();
        
        if (productoDoc.exists) {
            const stockActual = productoDoc.data().stock;
            const nuevoStock = stockActual - cantidad;
            
            await productoRef.update({
                stock: nuevoStock
            });
            
            console.log(`Stock actualizado: ${productoDoc.data().nombre} - Nuevo stock: ${nuevoStock}`);
        }
    } catch (error) {
        console.error("Error actualizando stock en Firebase:", error);
    }
}

/**
 * Restaurar stock cuando se elimina del carrito
 */
async function restaurarStockFirebase(productId, cantidad) {
    try {
        const productoRef = db.collection("producto").doc(productId);
        const productoDoc = await productoRef.get();
        
        if (productoDoc.exists) {
            const stockActual = productoDoc.data().stock;
            const nuevoStock = stockActual + cantidad;
            
            await productoRef.update({
                stock: nuevoStock
            });
            
            console.log(`Stock restaurado: ${productoDoc.data().nombre} - Nuevo stock: ${nuevoStock}`);
        }
    } catch (error) {
        console.error("Error restaurando stock en Firebase:", error);
    }
}


/**
 * Aumenta la cantidad de un producto en el carrito
 */
function aumentarCantidad(index) {
    const producto = carrito[index];
    
    // Verificar stock antes de aumentar
    if (producto.stock <= producto.cantidad) {
        mostrarNotificacion('No hay suficiente stock disponible', 'error');
        return;
    }
    
    carrito[index].cantidad = (carrito[index].cantidad || 1) + 1;
    guardarCarrito();
    renderizarCarrito();
    calcularTotal();
    
    // Actualizar stock en Firebase
    actualizarStockFirebase(producto.id, 1);
}


/**
 * Disminuye la cantidad de un producto en el carrito
 */
function disminuirCantidad(index) {
    const producto = carrito[index];
    
    if (carrito[index].cantidad > 1) {
        carrito[index].cantidad--;
        guardarCarrito();
        renderizarCarrito();
        calcularTotal();
        
        // Restaurar stock en Firebase
        restaurarStockFirebase(producto.id, 1);
    }
}

/**
 * Elimina un producto del carrito
 */
async function eliminarDelCarrito(index) {
    const producto = carrito[index];
    if (!producto) return;
    const cantidadEliminada = producto.cantidad || 1;

    // Eliminar del arreglo local primero
    carrito.splice(index, 1);
    guardarCarrito();
    renderizarCarrito();
    calcularTotal();
    mostrarNotificacion(`"${producto.nombre}" eliminado del carrito`);

    // Intentar restaurar stock en Firebase y manejar errores
    try {
        console.log(`Restaurando stock en Firebase para id=${producto.id}, cantidad=${cantidadEliminada}`);
        await restaurarStockFirebase(producto.id, cantidadEliminada);
    } catch (err) {
        console.error('Error al restaurar stock al eliminar del carrito:', err);
        mostrarNotificacion('No se pudo restaurar el stock en el servidor (ver consola)', 'error');
    }
}

/**
 * Calcula el total del carrito
 */
function calcularTotal() {
    const total = carrito.reduce((sum, producto) => {
        return sum + ((producto.precio || 0) * (producto.cantidad || 1));
    }, 0);
    const totalEl = document.getElementById('totalCarrito');
    if (totalEl) totalEl.textContent = total.toLocaleString('es-CL');
    actualizarCarritoHeader();
}

/**
 * Actualiza el header del carrito
 */
function actualizarCarritoHeader() {
    const cantidadProductos = carrito.reduce((sum, producto) => {
        return sum + (producto.cantidad || 1);
    }, 0);

    const contador = document.querySelector('.carrito-total');
    if (contador) contador.textContent = cantidadProductos;
}


/**
 * Guarda el carrito en localStorage
 */
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

/**
 * Limpia todo el carrito
 */
async function limpiarCarrito() {
    if (carrito.length === 0) {
        alert('El carrito ya está vacío');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres limpiar todo el carrito?')) return;

    // Restaurar stock para todos los productos en el carrito antes de vaciarlo
    const restauraciones = carrito.map(item => {
        const cantidad = item.cantidad || 1;
        console.log(`Restaurar stock (limpiar): id=${item.id} cantidad=${cantidad}`);
        return restaurarStockFirebase(item.id, cantidad).catch(err => {
            console.error(`Error restaurando stock para ${item.id}:`, err);
            return { error: true, id: item.id };
        });
    });

    // Esperar todas las restauraciones (no bloqueamos si alguna falla)
    await Promise.all(restauraciones);

    // Vaciar carrito local
    carrito = [];
    guardarCarrito();
    renderizarCarrito();
    calcularTotal();
    mostrarNotificacion('Carrito limpiado correctamente');
}

/**
 * Redirige al checkout
 */
function irAlCheckout() {
    if (carrito.length === 0) {
        alert('Agrega productos al carrito antes de continuar');
        return;
    }
    
    window.location.href = 'checkout.html';
}

/**
 * Muestra una notificación temporal
 */
function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        font-weight: 600;
    `;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

/**
 * Configura los eventos de la página
 */
function configurarEventos() {
    const btnLimpiar = document.getElementById('btnLimpiarCarrito');
    const btnComprar = document.getElementById('btnComprarAhora');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarCarrito);
    if (btnComprar) btnComprar.addEventListener('click', irAlCheckout);
}

// Hacer funciones disponibles globalmente
window.aumentarCantidad = aumentarCantidad;
window.disminuirCantidad = disminuirCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;