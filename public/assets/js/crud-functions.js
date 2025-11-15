// Versión segura y mínima de crud-functions para evitar errores cuando
// la instancia Firestore (this.db) no está inicializada y/o cuando
// window.crudManager (React) está disponible.

class CRUDFunctionsSafe {
	constructor() {
		this.db = (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) ? firebase.firestore() : null;
	}

	verificarFirebase() {
		if (!this.db && typeof window.crudManager === 'undefined') {
			console.warn('Firebase no inicializado y window.crudManager no disponible');
			return false;
		}
		return true;
	}

	mostrarLoading(elementId) {
		const elemento = document.getElementById(elementId);
		if (elemento) elemento.innerHTML = '<tr><td colspan="10" class="loading">Cargando...</td></tr>';
	}

	mostrarError(elementId, mensaje) {
		const elemento = document.getElementById(elementId);
		if (elemento) elemento.innerHTML = `<tr><td colspan="10" class="error">${mensaje}</td></tr>`;
	}

	async cargarUsuarios() {
		try {
			this.mostrarLoading('usuarios-tbody');

			if (typeof window.crudManager?.obtenerDatosUsuarios === 'function') {
				console.log('Usando window.crudManager para obtener usuarios');
				const usuarios = await window.crudManager.obtenerDatosUsuarios();
				this.mostrarUsuarios(usuarios);
				return usuarios;
			}

			if (!this.verificarFirebase()) {
				this.mostrarError('usuarios-tbody', 'Firebase no inicializado');
				return [];
			}

			const snapshot = await this.db.collection('usuario').get();
			const usuarios = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
			this.mostrarUsuarios(usuarios);
			return usuarios;
		} catch (err) {
			console.error('Error cargando usuarios (safe):', err);
			this.mostrarError('usuarios-tbody', 'Error al cargar usuarios');
			return [];
		}
	}

	async cargarCategorias() {
		try {
			this.mostrarLoading('categorias-tbody');

			if (typeof window.crudManager?.obtenerDatosProductos === 'function') {
				console.log('Usando window.crudManager para obtener productos y extraer categorías');
				const productos = await window.crudManager.obtenerDatosProductos();
				const categorias = this.extraerCategoriasDeProductos(productos);
				this.mostrarCategorias(categorias);
				return categorias;
			}

			if (!this.verificarFirebase()) {
				this.mostrarError('categorias-tbody', 'Firebase no inicializado');
				return [];
			}

			const productosSnapshot = await this.db.collection('producto').get();
			const categorias = this.extraerCategoriasDeProductosSnapshot(productosSnapshot);
			this.mostrarCategorias(categorias);
			return categorias;
		} catch (err) {
			console.error('Error cargando categorías (safe):', err);
			this.mostrarError('categorias-tbody', 'Error al cargar categorías');
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
			tbody.innerHTML = '<tr><td colspan="8" class="no-data">No hay usuarios registrados</td></tr>';
			return;
		}

		tbody.innerHTML = usuarios.map(usuario => `\\
			<tr>\\
				<td>${usuario.nombre || 'N/A'}</td>\\
				<td>${usuario.email || 'N/A'}</td>\\
				<td>${usuario.telefono || 'N/A'}</td>\\
				<td>${usuario.ciudad || 'N/A'}</td>\\
				<td>${usuario.rol || 'cliente'}</td>\\
				<td>${usuario.createdAt?.toLocaleDateString?.() || 'N/A'}</td>\\
				<td>\\
					<button onclick="crudFunctionsSafe.editarUsuario('${usuario.id}')" class="btn-edit">Editar</button>\\
					<button onclick="crudFunctionsSafe.eliminarUsuario('${usuario.id}')" class="btn-delete">Eliminar</button>\\
				</td>\\
			</tr>\\
		`).join('');
	}

	mostrarCategorias(categorias) {
		const tbody = document.getElementById('categorias-tbody');
		if (!tbody) return;

		if (!categorias || categorias.length === 0) {
			tbody.innerHTML = '<tr><td colspan="4" class="no-data">No hay categorías registradas</td></tr>';
			return;
		}

		tbody.innerHTML = categorias.map(categoria => `\\
			<tr>\\
				<td>${categoria.nombre}</td>\\
				<td>${categoria.cantidad}</td>\\
				<td>\\
					<button onclick="crudFunctionsSafe.editarCategoria('${categoria.id || categoria.nombre}')" class="btn-edit">Editar</button>\\
					<button onclick="crudFunctionsSafe.eliminarCategoria('${categoria.id || categoria.nombre}')" class="btn-delete">Eliminar</button>\\
				</td>\\
			</tr>\\
		`).join('');
	}

	editarUsuario(id) { console.log('editarUsuario', id); }
	eliminarUsuario(id) { console.log('eliminarUsuario', id); }
	editarCategoria(id) { console.log('editarCategoria', id); }
	eliminarCategoria(id) { console.log('eliminarCategoria', id); }
}

window.crudFunctionsSafe = new CRUDFunctionsSafe();

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
};
