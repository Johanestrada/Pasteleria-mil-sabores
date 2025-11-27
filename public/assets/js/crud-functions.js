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
			// Actualizar header del admin con el email del usuario que inició sesión
			const headerEmail = document.getElementById('userEmail');
			if (headerEmail) headerEmail.textContent = usuario.email || usuario.correo || headerEmail.textContent;
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
			tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay usuarios registrados</td></tr>';
			return;
		}

		tbody.innerHTML = usuarios.map(usuario => {
			const fechaRegistro = (usuario.createdAt && usuario.createdAt.toDate) ? usuario.createdAt.toDate().toLocaleDateString() : 'N/A';
			const estado = usuario.activo === false ? '<span class="badge inactivo">Inactivo</span>' : '<span class="badge activo">Activo</span>';
			const rolClass = usuario.rol || 'cliente';
			return `
				<tr>
					<td>${usuario.nombre || 'N/A'}</td>
					<td>${usuario.email || 'N/A'}</td>
					<td>${usuario.telefono || 'N/A'}</td>
					<td><span class="badge ${rolClass}">${rolClass}</span></td>
					<td>${estado}</td>
					<td>${fechaRegistro}</td>
					<td class="acciones">
						<button onclick="crudFunctions.editarUsuario('${usuario.id}')" class="btn btn-sm btn-warning" title="Editar"><i class="bi bi-pencil"></i></button>
						<button onclick="crudFunctions.cambiarEstadoUsuario('${usuario.id}', ${usuario.activo !== false})" class="btn btn-sm btn-secondary" title="${usuario.activo !== false ? 'Desactivar' : 'Activar'}"><i class="bi bi-${usuario.activo !== false ? 'pause' : 'play'}"></i></button>
						<button onclick="crudFunctions.cambiarRolUsuario('${usuario.id}')" class="btn btn-sm btn-info" title="Cambiar Rol"><i class="bi bi-person-gear"></i></button>
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
	editarUsuario(id) { 
		console.log('Editar usuario:', id); 
		const el = document.getElementById('modalUsuario');
		const passwordField = document.getElementById('passwordField');
		const passwordInput = document.getElementById('usuarioClave');
		
		if (el) {
			document.getElementById('modalUsuarioTitulo').textContent = 'Editar Usuario';
			// Ocultar campo de contraseña cuando se edita
			if (passwordField) passwordField.style.display = 'none';
			if (passwordInput) passwordInput.removeAttribute('required');
			el.style.display = 'block';
			// Cargar datos del usuario
			this.cargarDatosUsuario(id);
		}
	}

	async cargarDatosUsuario(usuarioId) {
		try {
			if (window.crudManager?.getUsuarioById) {
				const usuario = await window.crudManager.getUsuarioById(usuarioId);
				if (usuario) {
					document.getElementById('usuarioId').value = usuarioId;
					document.getElementById('usuarioNombre').value = usuario.nombre || '';
					document.getElementById('usuarioEmail').value = usuario.email || usuario.correo || '';
					document.getElementById('usuarioTelefono').value = usuario.telefono || '';
					document.getElementById('usuarioRol').value = usuario.rol || 'cliente';
					document.getElementById('usuarioActivo').checked = usuario.activo !== false;
				}
				return;
			}

			if (!this.verificarFirebase()) return;
			const snapshot = await this.db.collection('usuario').doc(usuarioId).get();
			if (snapshot.exists) {
				const usuario = snapshot.data();
				document.getElementById('usuarioId').value = usuarioId;
				document.getElementById('usuarioNombre').value = usuario.nombre || '';
				document.getElementById('usuarioEmail').value = usuario.email || usuario.correo || '';
				document.getElementById('usuarioTelefono').value = usuario.telefono || '';
				document.getElementById('usuarioRol').value = usuario.rol || 'cliente';
				document.getElementById('usuarioActivo').checked = usuario.activo !== false;
			}
		} catch (err) {
			console.error('Error cargando usuario:', err);
		}
	}

	async guardarUsuario(usuarioData) {
		try {
			if (usuarioData.id) {
				// Actualizar usuario existente (sin tocar contraseña)
				const usuario = {
					nombre: usuarioData.nombre,
					email: usuarioData.email,
					telefono: usuarioData.telefono,
					rol: usuarioData.rol,
					activo: usuarioData.activo,
					updatedAt: new Date()
				};

				if (window.crudManager?.updateUsuario) {
					try {
						await window.crudManager.updateUsuario(usuarioData.id, usuario);
					} catch (e) {
						console.log('updateUsuario via crudManager falló, usando Firebase directo');
					}
				}

				if (this.verificarFirebase()) {
					await this.db.collection('usuario').doc(usuarioData.id).update(usuario);
				}
				
				alert('Usuario actualizado correctamente');
				document.getElementById('modalUsuario').style.display = 'none';
				this.cargarUsuarios();
			} else {
				// Crear nuevo usuario CON contraseña en Firebase Auth
				const contrasena = usuarioData.clave;
				
				if (!contrasena || contrasena.length < 6) {
					alert('La contraseña debe tener al menos 6 caracteres');
					return;
				}

				const usuario = {
					nombre: usuarioData.nombre,
					email: usuarioData.email,
					telefono: usuarioData.telefono,
					rol: usuarioData.rol,
					activo: true
				};

				try {
					// Intentar crear con crudManager (que incluye Firebase Auth).
					// Si la API React aún no está lista, esperar un poco por el evento `dashboardAPIReady`.
					if (!window.crudManager?.createUsuarioConContrasena) {
						console.warn('createUsuarioConContrasena no disponible, esperando a que DashboardAPI se inicialice...');
						const disponible = await new Promise(resolve => {
							if (window.crudManager?.createUsuarioConContrasena) return resolve(true);
							const onReady = () => resolve(!!window.crudManager?.createUsuarioConContrasena);
							window.addEventListener('dashboardAPIReady', onReady, { once: true });
							// Timeout razonable para evitar esperar indefinidamente
							setTimeout(() => resolve(!!window.crudManager?.createUsuarioConContrasena), 5000);
						});

						if (!disponible) {
							// Intentar fallback usando el SDK v8 (auth) cargándolo dinámicamente
							console.warn('createUsuarioConContrasena sigue sin estar disponible, intentando fallback con Firebase v8 Auth...');
							const ensureAuthV8 = () => new Promise(resolve => {
								if (typeof window.firebase !== 'undefined' && typeof window.firebase.auth === 'function') return resolve(true);
								const script = document.createElement('script');
								script.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
								script.onload = () => resolve(!!(window.firebase && typeof window.firebase.auth === 'function'));
								script.onerror = () => resolve(false);
								document.head.appendChild(script);
							});

							const ok = await ensureAuthV8();
							if (!ok || typeof window.firebase === 'undefined' || typeof window.firebase.auth !== 'function') {
								throw new Error('createUsuarioConContrasena no disponible. Asegúrate de que DashboardAPI está cargado.');
							}

							// Ahora usar firebase v8 para crear usuario en Auth y guardar perfil en Firestore
							try {
								const userCredential = await firebase.auth().createUserWithEmailAndPassword(usuarioData.email, contrasena);
								const uid = userCredential.user.uid;
								const perfilDoc = {
									...usuario,
									email: usuario.email || usuarioData.email,
									createdAt: new Date(),
									activo: true
								};
								await firebase.firestore().collection('usuario').doc(uid).set(perfilDoc);
								alert('Usuario creado correctamente con acceso al correo ' + usuarioData.email);
								document.getElementById('modalUsuario').style.display = 'none';
								this.cargarUsuarios();
								return;
							} catch (errAuth) {
								console.error('Fallback auth v8 falló:', errAuth);
								if (errAuth.code === 'auth/email-already-in-use') {
									alert('El correo ya está registrado en el sistema');
								} else if (errAuth.code === 'auth/weak-password') {
									alert('La contraseña es muy débil. Debe tener al menos 6 caracteres');
								} else {
									alert('Error al crear usuario (fallback): ' + (errAuth.message || errAuth));
								}
								return;
							}
						}
					}

					console.log('Creando usuario con contraseña via crudManager');
					await window.crudManager.createUsuarioConContrasena(
						usuarioData.email,
						contrasena,
						usuario
					);
					
					alert('Usuario creado correctamente con acceso al correo ' + usuarioData.email);
					document.getElementById('modalUsuario').style.display = 'none';
					this.cargarUsuarios();
				} catch (err) {
					console.error('Error al crear usuario:', err);
					// Mostrar mensaje de error más específico
					if (err.code === 'auth/email-already-in-use') {
						alert('El correo ya está registrado en el sistema');
					} else if (err.code === 'auth/weak-password') {
						alert('La contraseña es muy débil. Debe tener al menos 6 caracteres');
					} else {
						alert('Error al crear usuario: ' + err.message);
					}
				}
			}
		} catch (err) {
			console.error('Error guardando usuario:', err);
			alert('Error al guardar el usuario: ' + (err?.message || err));
		}
	}

	async cambiarEstadoUsuario(usuarioId, estadoActual) {
		const nuevoEstado = !estadoActual;
		const accion = nuevoEstado ? 'activar' : 'desactivar';
		
		if (!confirm(`¿Estás seguro de que deseas ${accion} este usuario?`)) return;

		try {
			if (window.crudManager?.updateUsuario) {
				await window.crudManager.updateUsuario(usuarioId, { activo: nuevoEstado });
				alert(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
				this.cargarUsuarios();
				return;
			}

			if (!this.verificarFirebase()) return;
			await this.db.collection('usuario').doc(usuarioId).update({
				activo: nuevoEstado,
				updatedAt: new Date()
			});
			alert(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
			this.cargarUsuarios();
		} catch (err) {
			console.error('Error cambiando estado:', err);
			alert('Error al cambiar el estado del usuario');
		}
	}

	async cambiarRolUsuario(usuarioId) {
		const nuevoRol = prompt('Ingrese el nuevo rol (admin/cliente):');
		if (!nuevoRol) return;

		const rolesPermitidos = ['admin', 'cliente'];
		if (!rolesPermitidos.includes(nuevoRol.toLowerCase())) {
			alert('Rol no válido. Use: admin o cliente');
			return;
		}

		try {
			if (window.crudManager?.updateUsuario) {
				await window.crudManager.updateUsuario(usuarioId, { rol: nuevoRol.toLowerCase() });
				alert('Rol actualizado correctamente');
				this.cargarUsuarios();
				return;
			}

			if (!this.verificarFirebase()) return;
			await this.db.collection('usuario').doc(usuarioId).update({
				rol: nuevoRol.toLowerCase(),
				updatedAt: new Date()
			});
			alert('Rol actualizado correctamente');
			this.cargarUsuarios();
		} catch (err) {
			console.error('Error cambiando rol:', err);
			alert('Error al cambiar el rol del usuario');
		}
	}

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

	editarProducto(id) { 
		console.log('Editar producto:', id); 
		const el = document.getElementById('modalProducto');
		if (el) {
			document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
			el.style.display = 'block';
			this.cargarDatosProducto(id);
		}
	}

	async cargarDatosProducto(productoId) {
		try {
			if (window.crudManager?.getProductoById) {
				const producto = await window.crudManager.getProductoById(productoId);
				if (producto) {
					document.getElementById('productoId').value = productoId;
					document.getElementById('productoNombre').value = producto.nombre || '';
					document.getElementById('productoPrecio').value = producto.precio || '';
					document.getElementById('productoStock').value = producto.stock || '';
					document.getElementById('productoCategoria').value = producto.categoria || '';
					document.getElementById('productoImagen').value = producto.imagen || '';
				}
				return;
			}

			if (!this.verificarFirebase()) return;
			const snapshot = await this.db.collection('producto').doc(productoId).get();
			if (snapshot.exists) {
				const producto = snapshot.data();
				document.getElementById('productoId').value = productoId;
				document.getElementById('productoNombre').value = producto.nombre || '';
				document.getElementById('productoPrecio').value = producto.precio || '';
				document.getElementById('productoStock').value = producto.stock || '';
				document.getElementById('productoCategoria').value = producto.categoria || '';
				document.getElementById('productoImagen').value = producto.imagen || '';
			}
		} catch (err) {
			console.error('Error cargando producto:', err);
		}
	}

	async guardarProducto(productoData) {
		try {
			const producto = {
				nombre: productoData.nombre,
				precio: parseFloat(productoData.precio),
				stock: parseInt(productoData.stock),
				categoria: productoData.categoria,
				imagen: productoData.imagen,
				activo: true,
				updatedAt: new Date()
			};

			if (productoData.id) {
				// Actualizar producto
				if (window.crudManager?.updateProducto) {
					try {
						await window.crudManager.updateProducto(productoData.id, producto);
					} catch (e) {
						console.log('updateProducto via crudManager falló, usando Firebase directo');
					}
				}

				if (this.verificarFirebase()) {
					await this.db.collection('producto').doc(productoData.id).update(producto);
				}
				
				alert('Producto actualizado correctamente');
				if (document.getElementById('modalProducto')) {
					document.getElementById('modalProducto').style.display = 'none';
				}
				this.cargarProductos();
			} else {
				// Crear nuevo producto
				producto.createdAt = new Date();
			
				// Intentar crear vía crudManager (React). Si funciona, no duplicar en Firestore.
				let creadoPorManager = false;
				if (window.crudManager?.createProducto) {
					try {
						const res = await window.crudManager.createProducto(producto);
						// Si la función devuelve un id o true, asumimos que creó el producto
						if (res) creadoPorManager = true;
					} catch (e) {
						console.log('createProducto via crudManager falló, intentando fallback directo a Firestore');
					}
				}

				if (!creadoPorManager && this.verificarFirebase()) {
					await this.db.collection('producto').add(producto);
				}

				alert('Producto creado correctamente');
				if (document.getElementById('modalProducto')) {
					document.getElementById('modalProducto').style.display = 'none';
				}
				this.cargarProductos();
			}
		} catch (err) {
			console.error('Error guardando producto:', err);
			alert('Error al guardar el producto: ' + (err?.message || err));
		}
	}

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

	async actualizarPerfil(perfilData) {
		try {
			const usuarioStr = localStorage.getItem('usuario');
			const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

			if (!usuario || !usuario.email) {
				alert('No se pudo obtener la información del usuario');
				return false;
			}

			const docId = usuario.uid || usuario.id || usuario.email;

			// Intentar actualizar vía crudManager si está disponible (React)
			if (window.crudManager?.updateUsuario) {
				try {
					await window.crudManager.updateUsuario(docId, {
						nombre: perfilData.nombre,
						email: perfilData.email || usuario.email,
						telefono: perfilData.telefono,
						updatedAt: new Date()
					});
				} catch (e) {
					console.log('updateUsuario via crudManager falló, intentando fallback a Firestore');
				}
			}

			// Fallback: actualizar directamente en Firestore si está disponible
			if (this.verificarFirebase() && this.db) {
				try {
					// Intentar actualizar primero
					await this.db.collection('usuario').doc(docId).update({
						nombre: perfilData.nombre,
						email: perfilData.email || usuario.email,
						telefono: perfilData.telefono,
						updatedAt: new Date()
					});
				} catch (err) {
					// Si el documento no existe, crearlo
					if (err.code === 'not-found' || err.message.includes('No document')) {
						console.log('Documento no existe, creándolo...');
						await this.db.collection('usuario').doc(docId).set({
							nombre: perfilData.nombre,
							email: perfilData.email || usuario.email,
							telefono: perfilData.telefono,
							rol: usuario.rol || 'cliente',
							activo: true,
							createdAt: new Date(),
							updatedAt: new Date()
						});
					} else {
						throw err;
					}
				}
			}

			// Actualizar localStorage
			usuario.nombre = perfilData.nombre;
			usuario.email = perfilData.email || usuario.email;
			usuario.telefono = perfilData.telefono;
			localStorage.setItem('usuario', JSON.stringify(usuario));

			// Actualizar el header si existe
			const bienvenidoPrincipal = document.getElementById('bienvenidoPrincipal');
			if (bienvenidoPrincipal) {
				bienvenidoPrincipal.textContent = `Bienvenido, ${usuario.nombre}`;
			}

			const userEmail = document.getElementById('userEmail');
			if (userEmail) {
				userEmail.textContent = usuario.email;
			}

			return true;
		} catch (error) {
			console.error('Error actualizando perfil:', error);
			return false;
		}
	}

	async verOrden(id) {
		console.log('Ver orden:', id);
		try {
			if (!this.db) throw new Error('Firestore no inicializado');
			const doc = await this.db.collection('compras').doc(id).get();
			if (!doc.exists) {
				alert('Orden no encontrada');
				return;
			}
			const data = doc.data();
			// Guardar en localStorage para que la página de detalle pueda mostrarla
			localStorage.setItem('ultimaCompra', JSON.stringify({ ...data, id: doc.id }));
			// Redirigir a la página pública de compraExitosa para ver detalle (ruta absoluta en el servidor)
			window.location.href = '/assets/page/compraExitosa.html?orden=' + (data.numeroOrden || doc.id);
		} catch (err) {
			console.error('Error verOrden:', err);
			alert('Error al obtener la orden. Revisa la consola.');
		}
	}

	async editarOrden(id) {
		console.log('Editar orden:', id);
		try {
			const nuevoEstado = prompt('Ingrese el nuevo estado (pendiente/procesando/completada/error_pago/cancelado):');
			if (!nuevoEstado) return;
			if (!this.db) throw new Error('Firestore no inicializado');
			await this.db.collection('compras').doc(id).update({
				estado: nuevoEstado,
				updatedAt: (firebase.firestore && firebase.firestore.FieldValue) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
			});
			alert('Estado actualizado correctamente');
			// Recargar la lista de órdenes
			if (typeof this.cargarOrdenes === 'function') this.cargarOrdenes();
			else if (window.cargarOrdenes) window.cargarOrdenes();
		} catch (err) {
			console.error('Error editarOrden:', err);
			alert('Error al actualizar la orden. Revisa la consola.');
		}
	}

	async eliminarOrden(id) {
		try {
			if (!confirm('¿Estás seguro de eliminar la orden ' + id + '? Esta acción no se puede deshacer.')) return;
			if (!this.db) throw new Error('Firestore no inicializado');
			await this.db.collection('compras').doc(id).delete();
			alert('Orden eliminada correctamente');
			// Refrescar la lista de órdenes
			if (typeof this.cargarOrdenes === 'function') this.cargarOrdenes();
			else if (window.cargarOrdenes) window.cargarOrdenes();
		} catch (err) {
			console.error('Error eliminarOrden:', err);
			alert('Error al eliminar la orden. Revisa la consola.');
		}
	}
}// Instanciar la versión segura (si no fue instanciada desde el constructor)
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
		// Limpiar campos
		document.getElementById('productoId').value = '';
		document.getElementById('productoNombre').value = '';
		document.getElementById('productoPrecio').value = '';
		document.getElementById('productoStock').value = '';
		document.getElementById('productoCategoria').value = '';
		document.getElementById('productoImagen').value = '';
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
	const passwordField = document.getElementById('passwordField');
	const passwordInput = document.getElementById('usuarioClave');
	
	if (el) {
		document.getElementById('modalUsuarioTitulo').textContent = 'Nuevo Usuario';
		
		// Mostrar campo de contraseña para nuevos usuarios
		if (passwordField) passwordField.style.display = 'block';
		if (passwordInput) passwordInput.setAttribute('required', 'required');
		
		// Limpiar campos
		document.getElementById('usuarioId').value = '';
		document.getElementById('usuarioNombre').value = '';
		document.getElementById('usuarioEmail').value = '';
		document.getElementById('usuarioClave').value = '';
		document.getElementById('usuarioTelefono').value = '';
		document.getElementById('usuarioRol').value = 'cliente';
		document.getElementById('usuarioActivo').checked = true;
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
            // Normalizar etiqueta de cliente: puede venir como objeto {nombre,apellidos,correo} o como string
            let clienteLabel = 'N/A';
            if (o.cliente) {
                if (typeof o.cliente === 'string') clienteLabel = o.cliente;
                else if (typeof o.cliente === 'object') clienteLabel = `${o.cliente.nombre || ''}${o.cliente.apellidos ? ' ' + o.cliente.apellidos : ''}`.trim() || (o.cliente.email || 'N/A');
            } else if (o.usuario) {
                if (typeof o.usuario === 'string') clienteLabel = o.usuario;
                else if (typeof o.usuario === 'object') clienteLabel = `${o.usuario.nombre || ''}${o.usuario.apellidos ? ' ' + o.usuario.apellidos : ''}`.trim() || (o.usuario.email || 'N/A');
            } else if (o.clienteNombre) {
                clienteLabel = o.clienteNombre;
            }

            return `
			<tr>
				<td>${o.id}</td>
				<td>${clienteLabel}</td>
				<td>$${(o.total || 0).toFixed(2)}</td>
				<td>${estado}</td>
				<td>${fecha}</td>
				<td class="acciones">
					<button onclick="crudFunctions.verOrden('${o.id}')" class="btn btn-sm btn-info" title="Ver"><i class="bi bi-eye"></i></button>
					<button onclick="crudFunctions.editarOrden('${o.id}')" class="btn btn-sm btn-warning" title="Editar"><i class="bi bi-pencil"></i></button>
					<button onclick="crudFunctions.eliminarOrden('${o.id}')" class="btn btn-sm btn-danger" title="Eliminar"><i class="bi bi-trash"></i></button>
				</td>
			</tr>
		`}).join('');
	} catch (err) {
		console.error('Error en cargarOrdenes shim:', err);
        const tbody = document.getElementById('ordenes-tbody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="error-state">Error al cargar órdenes.</td></tr>';
	}
}

async function actualizarPerfil(event) {
	event.preventDefault();
	
	const perfilData = {
		nombre: document.getElementById('profileNombre').value,
		email: document.getElementById('profileCorreo')?.value || document.getElementById('profileEmail')?.value,
		telefono: document.getElementById('profileTelefono').value
	};

	if (!perfilData.nombre || !perfilData.email) {
		alert('Por favor completa los campos requeridos');
		return;
	}

	if (window.crudFunctionsSafe) {
		const success = await window.crudFunctionsSafe.actualizarPerfil(perfilData);
		if (success) {
			alert('Perfil actualizado correctamente');
		} else {
			alert('Error al actualizar el perfil');
		}
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
window.actualizarPerfil = window.actualizarPerfil || actualizarPerfil;

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

function guardarProducto(event) {
	event.preventDefault();
	
	const productoData = {
		id: document.getElementById('productoId').value || null,
		nombre: document.getElementById('productoNombre').value,
		precio: document.getElementById('productoPrecio').value,
		stock: document.getElementById('productoStock').value,
		categoria: document.getElementById('productoCategoria').value,
		imagen: document.getElementById('productoImagen').value
	};

	if (!productoData.nombre || !productoData.precio || !productoData.stock) {
		alert('Por favor completa todos los campos requeridos');
		return;
	}

	if (window.crudFunctionsSafe) {
		window.crudFunctionsSafe.guardarProducto(productoData);
	}
}

function guardarUsuario(event) {
	event.preventDefault();
	
	const usuarioId = document.getElementById('usuarioId').value || null;
	const passwordInput = document.getElementById('usuarioClave');
	
	const usuarioData = {
		id: usuarioId,
		nombre: document.getElementById('usuarioNombre').value,
		email: document.getElementById('usuarioEmail').value,
		telefono: document.getElementById('usuarioTelefono').value,
		rol: document.getElementById('usuarioRol').value,
		activo: document.getElementById('usuarioActivo').checked
	};

	// Si es nuevo usuario, incluir contraseña
	if (!usuarioId && passwordInput) {
		usuarioData.clave = passwordInput.value;
	}

	if (!usuarioData.nombre || !usuarioData.email) {
		alert('Por favor completa los campos requeridos (Nombre, Email)');
		return;
	}

	// Validar contraseña para nuevos usuarios
	if (!usuarioId && usuarioData.clave) {
		if (usuarioData.clave.length < 6) {
			alert('La contraseña debe tener al menos 6 caracteres');
			return;
		}
	}

	if (window.crudFunctionsSafe) {
		window.crudFunctionsSafe.guardarUsuario(usuarioData);
	}
}

