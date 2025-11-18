// Versión segura y mínima de crud-functions para evitar errores cuando
// la instancia Firestore (this.db) no está inicializada y/o cuando
// window.crudManager (React) está disponible.

class CRUDFunctionsSafe {
	constructor() {
		this.db = null;
		// Exponer la instancia en globales para compatibilidad con scripts existentes
		window.crudFunctionsSafe = this;
		if (!window.crudFunctions) window.crudFunctions = this;
		
		// Estas funciones no dependen de Firebase, se pueden ejecutar de inmediato
		this.cargarDatosPerfil();
		this.ocultarModalesAlInicio();
		console.log('CRUDFunctionsSafe: Instancia creada, esperando DB...');
	}

	// Método para inyectar la dependencia de Firestore desde fuera
	setDb(db) {
		this.db = db;
		console.log('CRUDFunctionsSafe: Instancia de Firestore recibida y configurada.');
	}

	ocultarModalesAlInicio() {
		const modales = ['modalProducto', 'modalCategoria', 'modalUsuario'];
		modales.forEach(id => {
			const el = document.getElementById(id);
			if (el) el.style.display = 'none';
		});
	}

	cargarDatosPerfil() {
		try {
			const usuarioStr = localStorage.getItem('usuario');
			if (!usuarioStr) return;
			const usuario = JSON.parse(usuarioStr);
			const profileNombre = document.getElementById('profileNombre');
			const profileCorreo = document.getElementById('profileEmail') || document.getElementById('profileCorreo');
			if (profileNombre) profileNombre.value = usuario.nombre || '';
			if (profileCorreo) profileCorreo.value = usuario.email || usuario.correo || '';
		} catch (e) {
			// no crítico
		}
	}

	verificarFirebase() {
		if (this.db) {
			return true;
		}
		
		if (typeof window.crudManager !== 'undefined') {
			console.warn('verificarFirebase: this.db es nulo, pero se encontró window.crudManager.');
			return true;
		}

		console.error('CRUDFunctionsSafe: Firebase DB no ha sido configurado. La función setDb(db) nunca fue llamada.');
		return false;
	}

	mostrarLoading(elementId, colspan) {
		const elemento = document.getElementById(elementId);
		if (elemento) elemento.innerHTML = `<tr><td colspan="${colspan}" class="loading">Cargando...</td></tr>`;
	}

	mostrarError(elementId, mensaje, colspan) {
		const elemento = document.getElementById(elementId);
		if (elemento) elemento.innerHTML = `<tr><td colspan="${colspan}" class="error">${mensaje}</td></tr>`;
	}

	async cargarUsuarios() {
		try {
			this.mostrarLoading('usuarios-tbody', 11);

			if (typeof window.crudManager?.obtenerDatosUsuarios === 'function') {
				const usuarios = await window.crudManager.obtenerDatosUsuarios();
				this.mostrarUsuarios(usuarios);
				return usuarios;
			}

			if (!this.verificarFirebase()) {
				this.mostrarError('usuarios-tbody', 'Firebase no inicializado', 11);
				return [];
			}

			const snapshot = await this.db.collection('usuario').get();
			const usuarios = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
			this.mostrarUsuarios(usuarios);
			return usuarios;
		} catch (err) {
			console.error('Error cargando usuarios (safe):', err);
			this.mostrarError('usuarios-tbody', 'Error al cargar usuarios', 11);
			return [];
		}
	}

	async cargarCategorias() {
		try {
			this.mostrarLoading('categorias-tbody', 5);

			if (typeof window.crudManager?.obtenerDatosProductos === 'function') {
				const productos = await window.crudManager.obtenerDatosProductos();
				const categorias = this.extraerCategoriasDeProductos(productos);
				this.mostrarCategorias(categorias);
				return categorias;
			}

			if (!this.verificarFirebase()) {
				this.mostrarError('categorias-tbody', 'Firebase no inicializado', 5);
				return [];
			}

			const productosSnapshot = await this.db.collection('producto').get();
			const categorias = this.extraerCategoriasDeProductosSnapshot(productosSnapshot);
			this.mostrarCategorias(categorias);
			return categorias;
		} catch (err) {
			console.error('Error cargando categorías (safe):', err);
			this.mostrarError('categorias-tbody', 'Error al cargar categorías', 5);
			return [];
		}
	}

	extraerCategoriasDeProductos(productos) {
		const map = new Map();
		productos.forEach(p => {
			const cat = p.categoria || 'Sin categoría';
			if (!map.has(cat)) map.set(cat, { nombre: cat, cantidad: 0 });
			map.get(cat).cantidad++;
		});
		return Array.from(map.values());
	}

	extraerCategoriasDeProductosSnapshot(snapshot) {
		const map = new Map();
		snapshot.docs.forEach(doc => {
			const p = doc.data();
			const cat = p.categoria || 'Sin categoría';
			if (!map.has(cat)) map.set(cat, { nombre: cat, cantidad: 0 });
			map.get(cat).cantidad++;
		});
		return Array.from(map.values());
	}

	mostrarUsuarios(usuarios) {
		const tbody = document.getElementById('usuarios-tbody');
		if (!tbody) return;

		if (!usuarios || usuarios.length === 0) {
			tbody.innerHTML = '<tr><td colspan="11" class="no-data">No hay usuarios registrados</td></tr>';
			return;
		}

		tbody.innerHTML = usuarios.map(usuario => {
			const fechaRegistro = (usuario.createdAt && usuario.createdAt.toDate) ? usuario.createdAt.toDate().toLocaleDateString() : 'N/A';
			const estado = usuario.activo === false ? '<span class="badge inactivo">Inactivo</span>' : '<span class="badge activo">Activo</span>';
			const rolClass = usuario.rol || 'cliente';
			return `
				<tr>
					<td>${usuario.run || 'N/A'}</td>
					<td>${usuario.nombre || 'N/A'}</td>
					<td>${usuario.email || 'N/A'}</td>
					<td>******</td>
					<td>${(usuario.fecha && usuario.fecha.toDate) ? usuario.fecha.toDate().toLocaleDateString() : 'N/A'}</td>
					<td>${usuario.telefono || 'N/A'}</td>
					<td>${usuario.direccion || 'N/A'}</td>
					<td><span class="badge ${rolClass}">${rolClass}</span></td>
					<td>${estado}</td>
					<td>${fechaRegistro}</td>
					<td class="acciones">
						<button onclick="crudFunctions.editarUsuario('${usuario.id}')" class="btn btn-sm btn-warning" title="Editar"><i class="bi bi-pencil"></i></button>
						<button onclick="crudFunctions.eliminarUsuario('${usuario.id}')" class="btn btn-sm btn-danger" title="Eliminar"><i class="bi bi-trash"></i></button>
					</td>
				</tr>
			`;
		}).join('');
	}

	mostrarCategorias(categorias) {
		const tbody = document.getElementById('categorias-tbody');
		if (!tbody) return;

		if (!categorias || categorias.length === 0) {
			tbody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="bi bi-inbox"></i><p>No hay categorías para mostrar.</p></td></tr>';
			return;
		}

		tbody.innerHTML = categorias.map(categoria => `
			<tr>
				<td>${categoria.nombre}</td>
				<td>${categoria.descripcion || 'Descripción no disponible'}</td>
				<td><span class="badge auto-generada">Auto-generada</span></td>
				<td>${categoria.cantidad}</td>
				<td class="acciones">
					<button onclick="crudFunctions.editarCategoria('${categoria.id || categoria.nombre}')" class="btn btn-sm btn-warning" title="Editar"><i class="bi bi-pencil"></i></button>
					<button onclick="crudFunctions.eliminarCategoria('${categoria.id || categoria.nombre}')" class="btn btn-sm btn-danger" title="Eliminar"><i class="bi bi-trash"></i></button>
				</td>
			</tr>
		`).join('');
	}

	// Stubs for actions
	editarUsuario(id) { console.log('Editar usuario:', id); alert('Función no implementada: Editar usuario ' + id); }
	async eliminarUsuario(id) {
		console.log('Eliminar usuario solicitado:', id);
		if (!id) return alert('ID de usuario inválido');

		if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

		// Primero intentar usar una API/manager si está disponible (React / crudManager)
		if (window.crudManager && typeof window.crudManager.deleteUsuario === 'function') {
			window.crudManager.deleteUsuario(id)
				.then(res => {
					alert('Usuario eliminado correctamente (vía CrudManager).');
					this.cargarUsuarios();
				})
				.catch(err => {
					console.error('Error eliminando usuario via CrudManager:', err);
					alert('Error eliminando usuario: ' + (err?.message || err));
				});
			return;
		}

		// Fallback: usar Firestore directamente (v8 style) si la DB fue inyectada
		if (!this.verificarFirebase()) {
			alert('No se puede eliminar: Firebase no inicializado.');
			return;
		}

		try {
			await this.db.collection('usuario').doc(id).delete();
			alert('Usuario eliminado correctamente.');
			// Refrescar lista
			this.cargarUsuarios();
		} catch (err) {
			console.error('Error eliminando usuario (direct DB):', err);
			alert('Error eliminando usuario: ' + (err?.message || err));
		}
	}
	editarCategoria(id) { console.log('Editar categoría:', id); alert('Función no implementada: Editar categoría ' + id); }

	async eliminarCategoria(id) {
		console.log('Eliminar categoría solicitado:', id);
		if (!id) return alert('ID de categoría inválido');
		if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

		if (window.crudManager && typeof window.crudManager.deleteCategoria === 'function') {
			window.crudManager.deleteCategoria(id)
				.then(res => {
					alert('Categoría eliminada correctamente.');
					this.cargarCategorias();
				})
				.catch(err => {
					console.error('Error eliminando categoría via CrudManager:', err);
					alert('Error eliminando categoría: ' + (err?.message || err));
				});
			return;
		}

		if (!this.verificarFirebase()) {
			alert('No se puede eliminar: Firebase no inicializado.');
			return;
		}

		try {
			await this.db.collection('categorias').doc(id).delete();
			alert('Categoría eliminada correctamente.');
			this.cargarCategorias();
		} catch (err) {
			console.error('Error eliminando categoría (direct DB):', err);
			alert('Error eliminando categoría: ' + (err?.message || err));
		}
	}

	editarProducto(id) { console.log('Editar producto:', id); alert('Función no implementada: Editar producto ' + id); }

	async eliminarProducto(id) {
		console.log('Eliminar producto solicitado:', id);
		if (!id) return alert('ID de producto inválido');
		if (!confirm('¿Estás seguro de eliminar este producto?')) return;

		if (window.crudManager && typeof window.crudManager.deleteProducto === 'function') {
			window.crudManager.deleteProducto(id)
				.then(res => {
					alert('Producto eliminado correctamente.');
					if (typeof window.cargarProductos === 'function') window.cargarProductos();
				})
				.catch(err => {
					console.error('Error eliminando producto via CrudManager:', err);
					alert('Error eliminando producto: ' + (err?.message || err));
				});
			return;
		}

		if (!this.verificarFirebase()) {
			alert('No se puede eliminar: Firebase no inicializado.');
			return;
		}

		try {
			await this.db.collection('producto').doc(id).delete();
			alert('Producto eliminado correctamente.');
			if (typeof window.cargarProductos === 'function') window.cargarProductos();
		} catch (err) {
			console.error('Error eliminando producto (direct DB):', err);
			alert('Error eliminando producto: ' + (err?.message || err));
		}
	}
    verOrden(id) { console.log('Ver orden:', id); alert('Función no implementada: Ver orden ' + id); }
    editarOrden(id) { console.log('Editar orden:', id); alert('Función no implementada: Editar orden ' + id); }
}

// Instanciar la versión segura (si no fue instanciada desde el constructor)
window.crudFunctionsSafe = window.crudFunctionsSafe || new CRUDFunctionsSafe();
// Mantener la compatibilidad con el global antiguo
if (!window.crudFunctions) window.crudFunctions = window.crudFunctionsSafe;

// Auto-carga segura al DOMContentLoaded para restaurar el comportamiento antiguo
document.addEventListener('DOMContentLoaded', () => {
	setTimeout(() => {
		try {
			if (document.getElementById('usuarios-tbody')) {
				console.log('Cargando usuarios automaticamente (auto)...');
				window.cargarUsuarios();
			}
			if (document.getElementById('categorias-tbody')) {
				console.log('Cargando categorias automaticamente (auto)...');
				window.cargarCategorias();
			}
		} catch (e) {
			console.warn('Auto carga inicial falló:', e);
		}

		// Ajuste de fechas para reportes si los inputs existen
		const hoy = new Date().toISOString().split('T')[0];
		const primerDiaMes = new Date(); primerDiaMes.setDate(1);
		const primerDiaStr = primerDiaMes.toISOString().split('T')[0];
		const fechaInicio = document.getElementById('fechaInicio');
		const fechaFin = document.getElementById('fechaFin');
		if (fechaInicio) fechaInicio.value = primerDiaStr;
		if (fechaFin) fechaFin.value = hoy;
	}, 1000);
});

// --- Shims globales para compatibilidad con admin.html (botones onclick) ---
function cerrarModal(id) {
	const el = document.getElementById(id);
	if (el) el.style.display = 'none';
}

function mostrarModalProducto() {
	const el = document.getElementById('modalProducto');
	if (el) {
		document.getElementById('modalProductoTitulo').textContent = 'Nuevo Producto';
		el.style.display = 'block';
	}
}

function mostrarModalCategoria() {
	const el = document.getElementById('modalCategoria');
	if (el) {
		document.getElementById('modalCategoriaTitulo').textContent = 'Nueva Categoría';
		el.style.display = 'block';
	}
}

function mostrarModalUsuario() {
	const el = document.getElementById('modalUsuario');
	if (el) {
		document.getElementById('modalUsuarioTitulo').textContent = 'Nuevo Usuario';
		el.style.display = 'block';
	}
}

async function cargarUsuarios() {
	if (window.crudFunctionsSafe) {
		await window.crudFunctionsSafe.cargarUsuarios();
	} else if (window.crudManager?.getUsuarios) {
		const usuarios = await window.crudManager.getUsuarios();
		if (window.crudFunctionsSafe) window.crudFunctionsSafe.mostrarUsuarios(usuarios || []);
	}
}

async function cargarCategorias() {
	if (window.crudFunctionsSafe) {
		await window.crudFunctionsSafe.cargarCategorias();
	} else if (window.crudManager?.getCategorias) {
		const categorias = await window.crudManager.getCategorias();
		if (window.crudFunctionsSafe) window.crudFunctionsSafe.mostrarCategorias(categorias || []);
	}
}

async function cargarProductos() {
	try {
		let productos = [];
		if (window.crudManager?.getProductos) {
			productos = await window.crudManager.getProductos();
		} else if (window.crudFunctionsSafe && window.crudFunctionsSafe.verificarFirebase()) {
			const snapshot = await window.crudFunctionsSafe.db.collection('producto').get();
			productos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		}
		
		const tbody = document.getElementById('productos-tbody');
		if (!tbody) return;
		if (!productos || productos.length === 0) {
			tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay productos registrados</td></tr>';
			return;
		}
		tbody.innerHTML = productos.map(producto => {
            const estado = (producto.stock || producto.cantidad || 0) > 0 ? '<span class="badge activo">En Stock</span>' : '<span class="badge inactivo">Agotado</span>';
            return `
			<tr>
				<td>${producto.nombre || 'Sin nombre'}</td>
				<td>$${(producto.precio || 0).toFixed(2)}</td>
				<td>${producto.stock || producto.cantidad || 0}</td>
                <td>${producto.categoria || 'N/A'}</td>
				<td>${estado}</td>
				<td class="acciones">
					<button onclick="crudFunctions.editarProducto('${producto.id}')" class="btn btn-sm btn-warning" title="Editar"><i class="bi bi-pencil"></i></button>
					<button onclick="crudFunctions.eliminarProducto('${producto.id}')" class="btn btn-sm btn-danger" title="Eliminar"><i class="bi bi-trash"></i></button>
				</td>
			</tr>
		`}).join('');
	} catch (err) {
		console.error('Error en cargarProductos shim:', err);
        const tbody = document.getElementById('productos-tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="error-state">Error al cargar productos.</td></tr>';
	}
}

async function cargarOrdenes() {
	try {
		let ordenes = [];
		if (window.crudManager?.getOrdenes) {
			ordenes = await window.crudManager.getOrdenes();
		} else if (window.crudFunctionsSafe && window.crudFunctionsSafe.verificarFirebase()) {
			const snapshot = await window.crudFunctionsSafe.db.collection('compras').get();
			ordenes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		}
		const tbody = document.getElementById('ordenes-tbody');
		if (!tbody) return;
		if (!ordenes || ordenes.length === 0) {
			tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay órdenes registradas</td></tr>';
			return;
		}
		tbody.innerHTML = ordenes.map(o => {
            const fecha = o.fecha && o.fecha.toDate ? o.fecha.toDate().toLocaleDateString() : (o.fecha ? new Date(o.fecha).toLocaleDateString() : 'N/A');
            const estado = `<span class="badge ${o.estado || 'pendiente'}">${o.estado || 'pendiente'}</span>`;
            return `
			<tr>
				<td>${o.id}</td>
				<td>${o.usuario || o.cliente || 'N/A'}</td>
				<td>$${(o.total || 0).toFixed(2)}</td>
				<td>${estado}</td>
				<td>${fecha}</td>
				<td class="acciones">
                    <button onclick="crudFunctions.verOrden('${o.id}')" class="btn btn-sm btn-info" title="Ver"><i class="bi bi-eye"></i></button>
					<button onclick="crudFunctions.editarOrden('${o.id}')" class="btn btn-sm btn-warning" title="Editar"><i class="bi bi-pencil"></i></button>
				</td>
			</tr>
		`}).join('');
	} catch (err) {
		console.error('Error en cargarOrdenes shim:', err);
        const tbody = document.getElementById('ordenes-tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="error-state">Error al cargar órdenes.</td></tr>';
	}
}

// Exportar funciones globales para compatibilidad si son requeridas por otros scripts
window.cargarUsuarios = window.cargarUsuarios || cargarUsuarios;
window.cargarCategorias = window.cargarCategorias || cargarCategorias;
window.cargarProductos = window.cargarProductos || cargarProductos;
window.cargarOrdenes = window.cargarOrdenes || cargarOrdenes;
window.mostrarModalProducto = window.mostrarModalProducto || mostrarModalProducto;
window.mostrarModalCategoria = window.mostrarModalCategoria || mostrarModalCategoria;
window.mostrarModalUsuario = window.mostrarModalUsuario || mostrarModalUsuario;
window.cerrarModal = window.cerrarModal || cerrarModal;

// Adaptador mínimo para compatibilidad con CrudManager y código existente
window.crudManager = window.crudManager || {
	getUsuarios: async () => await window.crudFunctionsSafe.cargarUsuarios(),
	getCategorias: async () => await window.crudFunctionsSafe.cargarCategorias(),
	getProductos: async () => {
		if (window.crudFunctionsSafe.verificarFirebase()) {
			const snapshot = await window.crudFunctionsSafe.db.collection('producto').get();
			return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		}
		return [];
	},
	getOrdenes: async () => {
		if (window.crudFunctionsSafe.verificarFirebase()) {
			const snapshot = await window.crudFunctionsSafe.db.collection('compras').get();
			return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		}
		return [];
	},
	getReporteVentas: async (inicio, fin) => {
		if (window.crudFunctionsSafe.verificarFirebase()) {
			let query = window.crudFunctionsSafe.db.collection('compras');
			if (inicio) query = query.where('fecha', '>=', inicio);
			if (fin) query = query.where('fecha', '<=', fin);
			const snapshot = await query.get();
			return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		}
		return [];
	},
	getProductosMasVendidos: async () => {
		// Implementación simple: retornar lista vacía (mejorar según requerimientos)
		return [];
	}
	,
	// Métodos para eliminar - compatibles con Manager/React o con Firestore directo
	deleteUsuario: async (id) => {
		if (typeof window.crudManagerInstance?.deleteUsuario === 'function') {
			return await window.crudManagerInstance.deleteUsuario(id);
		}
		if (window.crudFunctionsSafe && window.crudFunctionsSafe.verificarFirebase()) {
			await window.crudFunctionsSafe.db.collection('usuario').doc(id).delete();
			return true;
		}
		return false;
	},
	deleteProducto: async (id) => {
		if (typeof window.crudManagerInstance?.deleteProducto === 'function') {
			return await window.crudManagerInstance.deleteProducto(id);
		}
		if (window.crudFunctionsSafe && window.crudFunctionsSafe.verificarFirebase()) {
			await window.crudFunctionsSafe.db.collection('producto').doc(id).delete();
			return true;
		}
		return false;
	},
	deleteCategoria: async (id) => {
		if (typeof window.crudManagerInstance?.deleteCategoria === 'function') {
			return await window.crudManagerInstance.deleteCategoria(id);
		}
		if (window.crudFunctionsSafe && window.crudFunctionsSafe.verificarFirebase()) {
			await window.crudFunctionsSafe.db.collection('categorias').doc(id).delete();
			return true;
		}
		return false;
	}
};
