// ==================== FUNCIONES DE VENDEDOR - SOLO LECTURA ====================

class VendedorFunctions {
    constructor() {
        this.db = null;
        this.inicializarFirebase();
        this.cargarDatosPerfil();
    }

    inicializarFirebase() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyC8PHMRL_Z3q36hzJP0b_Nk7b0VwzHT_wE",
                authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
                projectId: "tiendapasteleriamilsabor-a193d",
                storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
                messagingSenderId: "656849405849",
                appId: "1:656849405849:web:8f8e96f40fa44c6f37d8e9",
                measurementId: "G-5KQN1TN9K2"
            };

            if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            console.log('Firebase listo para Vendedor');
        } catch (error) {
            console.error('Error inicializando Firebase para Vendedor:', error);
        }
    }

    cargarDatosPerfil() {
        try {
            const usuarioStr = localStorage.getItem('usuario');
            if (usuarioStr) {
                const usuario = JSON.parse(usuarioStr);
                document.getElementById('bienvenidoPrincipal').textContent = `Bienvenido, ${usuario.nombre || 'Vendedor'}`;
                document.getElementById('userEmail').textContent = usuario.email || 'vendedor@mitienda.com';
                
                // Cargar datos del perfil
                document.getElementById('profileNombre').value = usuario.nombre || '';
                document.getElementById('profileCorreo').value = usuario.email || '';
                document.getElementById('profileTelefono').value = usuario.telefono || '';
            }
        } catch (error) {
            console.error('Error cargando datos del perfil:', error);
        }
    }

    // Cargar órdenes (solo lectura)
    async cargarOrdenes() {
        try {
            const filtroEstado = document.getElementById('filtroEstado')?.value || '';
            
            let query = this.db.collection('compras');
            
            if (filtroEstado) {
                query = query.where('estado', '==', filtroEstado);
            }
            
            const snapshot = await query.get();
            const tbody = document.getElementById('ordenes-tbody');
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay órdenes</td></tr>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const orden = doc.data();
                const fecha = orden.fecha?.toDate ? orden.fecha.toDate() : new Date(orden.fecha);
                const estadoBadge = this.getBadgeEstado(orden.estado || 'pendiente');
                
                html += `
                    <tr>
                        <td>${orden.numeroOrden || doc.id}</td>
                        <td>${orden.cliente || 'N/A'}</td>
                        <td>${fecha.toLocaleDateString('es-ES')}</td>
                        <td>$${(orden.total || 0).toFixed(2)}</td>
                        <td>${estadoBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="verDetallesOrden('${doc.id}')">
                                <i class="bi bi-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        } catch (error) {
            console.error('Error cargando órdenes:', error);
            document.getElementById('ordenes-tbody').innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar órdenes</td></tr>';
        }
    }

    // Cargar productos (solo lectura)
    async cargarProductos() {
        try {
            const filtroCategoria = document.getElementById('filtroCategoria')?.value || '';
            
            let query = this.db.collection('producto');
            
            if (filtroCategoria) {
                query = query.where('categoria', '==', filtroCategoria);
            }
            
            const snapshot = await query.get();
            const tbody = document.getElementById('productos-tbody');
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay productos</td></tr>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const producto = doc.data();
                const estadoBadge = producto.activo 
                    ? '<span class="badge badge-completado">Activo</span>'
                    : '<span class="badge badge-cancelado">Inactivo</span>';
                
                html += `
                    <tr>
                        <td>${producto.nombre || 'Sin nombre'}</td>
                        <td>${producto.categoria || 'N/A'}</td>
                        <td>$${(producto.precio || 0).toFixed(2)}</td>
                        <td>${producto.stock || 0}</td>
                        <td>${estadoBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="verDetallesProducto('${doc.id}')">
                                <i class="bi bi-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        } catch (error) {
            console.error('Error cargando productos:', error);
            document.getElementById('productos-tbody').innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar productos</td></tr>';
        }
    }

    // Cargar categorías para filtro
    async cargarCategorias() {
        try {
            const snapshot = await this.db.collection('categorias').get();
            const selectCategoria = document.getElementById('filtroCategoria');
            
            if (selectCategoria) {
                snapshot.forEach(doc => {
                    const categoria = doc.data();
                    const option = document.createElement('option');
                    option.value = categoria.nombre;
                    option.textContent = categoria.nombre;
                    selectCategoria.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    getBadgeEstado(estado) {
        const estados = {
            'pendiente': '<span class="badge badge-pendiente">Pendiente</span>',
            'procesando': '<span class="badge badge-procesando">Procesando</span>',
            'completado': '<span class="badge badge-completado">Completado</span>',
            'cancelado': '<span class="badge badge-cancelado">Cancelado</span>'
        };
        return estados[estado] || '<span class="badge badge-pendiente">Desconocido</span>';
    }

    // Ver detalles de orden
    async verDetallesOrden(ordenId) {
        try {
            const doc = await this.db.collection('compras').doc(ordenId).get();
            
            if (!doc.exists) {
                alert('Orden no encontrada');
                return;
            }

            const orden = doc.data();
            const fecha = orden.fecha?.toDate ? orden.fecha.toDate() : new Date(orden.fecha);
            
            let productosHTML = '';
            if (orden.productos && Array.isArray(orden.productos)) {
                productosHTML = orden.productos.map(p => `
                    <tr>
                        <td>${p.nombre || 'Sin nombre'}</td>
                        <td>${p.cantidad || 1}</td>
                        <td>$${(p.precio || 0).toFixed(2)}</td>
                        <td>$${((p.cantidad || 1) * (p.precio || 0)).toFixed(2)}</td>
                    </tr>
                `).join('');
            }

            const detalles = `
                <div class="detalles-orden">
                    <p><strong>Número de Orden:</strong> ${orden.numeroOrden || doc.id}</p>
                    <p><strong>Cliente:</strong> ${orden.cliente || 'N/A'}</p>
                    <p><strong>Email:</strong> ${orden.clienteEmail || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${orden.direccion || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-ES')}</p>
                    <p><strong>Estado:</strong> ${this.getBadgeEstado(orden.estado || 'pendiente')}</p>
                    
                    <h4 style="margin-top: 1.5rem; color: #d42d6b;">Productos</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                        <thead>
                            <tr style="background: #ff7ba5; color: white;">
                                <th style="padding: 0.75rem; text-align: left;">Producto</th>
                                <th style="padding: 0.75rem; text-align: left;">Cantidad</th>
                                <th style="padding: 0.75rem; text-align: left;">Precio</th>
                                <th style="padding: 0.75rem; text-align: left;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosHTML}
                        </tbody>
                    </table>
                    
                    <p style="margin-top: 1.5rem; font-size: 1.2rem;"><strong>Total: $${(orden.total || 0).toFixed(2)}</strong></p>
                </div>
            `;

            document.getElementById('detallesOrden').innerHTML = detalles;
            document.getElementById('modalOrden').style.display = 'block';
        } catch (error) {
            console.error('Error cargando detalles de orden:', error);
            alert('Error al cargar los detalles de la orden');
        }
    }

    // Ver detalles de producto
    async verDetallesProducto(productoId) {
        try {
            const doc = await this.db.collection('producto').doc(productoId).get();
            
            if (!doc.exists) {
                alert('Producto no encontrado');
                return;
            }

            const producto = doc.data();
            const estadoBadge = producto.activo 
                ? '<span class="badge badge-completado">Activo</span>'
                : '<span class="badge badge-cancelado">Inactivo</span>';

            const detalles = `
                <div class="detalles-producto">
                    ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="max-width: 300px; margin-bottom: 1rem; border-radius: 8px;">` : ''}
                    <p><strong>Nombre:</strong> ${producto.nombre || 'Sin nombre'}</p>
                    <p><strong>Categoría:</strong> ${producto.categoria || 'N/A'}</p>
                    <p><strong>Precio:</strong> $${(producto.precio || 0).toFixed(2)}</p>
                    <p><strong>Stock:</strong> ${producto.stock || 0} unidades</p>
                    <p><strong>Estado:</strong> ${estadoBadge}</p>
                    ${producto.descripcion ? `<p><strong>Descripción:</strong> ${producto.descripcion}</p>` : ''}
                </div>
            `;

            document.getElementById('modalProductoTitulo').textContent = producto.nombre || 'Detalles del Producto';
            document.getElementById('detallesProducto').innerHTML = detalles;
            document.getElementById('modalProducto').style.display = 'block';
        } catch (error) {
            console.error('Error cargando detalles de producto:', error);
            alert('Error al cargar los detalles del producto');
        }
    }
}

// Instancia global
let vendedorFunctions = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    vendedorFunctions = new VendedorFunctions();
});

// ==================== FUNCIONES GLOBALES ====================

function cargarOrdenesVendedor() {
    if (vendedorFunctions) {
        vendedorFunctions.cargarOrdenes();
    }
}

function cargarProductosVendedor() {
    if (vendedorFunctions) {
        vendedorFunctions.cargarProductos();
    }
}

function verDetallesOrden(ordenId) {
    if (vendedorFunctions) {
        vendedorFunctions.verDetallesOrden(ordenId);
    }
}

function verDetallesProducto(productoId) {
    if (vendedorFunctions) {
        vendedorFunctions.verDetallesProducto(productoId);
    }
}

function filtrarProductos() {
    const buscar = document.getElementById('buscarProducto')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('#productos-tbody tr');
    
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(buscar) ? '' : 'none';
    });
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function editarPerfil() {
    alert('Para editar tu perfil, dirígete a tu cuenta personal');
}

function irATienda() {
    window.location.href = '/';
}

function cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    window.location.href = '/page/login.html';
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = event.target;
    if (modal.classList.contains('modal')) {
        modal.style.display = 'none';
    }
};
