document.addEventListener("DOMContentLoaded", async () => {
    // Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
        authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
        projectId: "tiendapasteleriamilsabor-a193d",
    };

    if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 1. Proteger la ruta: si no hay usuario, redirigir al login
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
        alert("Debes iniciar sesión para ver tu perfil.");
        window.location.href = "login.html";
        return;
    }

    const usuario = JSON.parse(usuarioStr);

    // 2. Rellenar la información del perfil en la página
    const nombreInput = document.getElementById('profile-nombre');
    const apellidoInput = document.getElementById('profile-apellido');
    const emailInput = document.getElementById('profile-email');
    const telefonoInput = document.getElementById('profile-telefono');
    const nombreHeader = document.getElementById('header-nombre');

    // Address inputs and display (region + comuna like checkout)
    const calleInput = document.getElementById('profile-calle');
    const deptoInput = document.getElementById('profile-depto');
    const regionInput = document.getElementById('profile-region');
    const comunaInput = document.getElementById('profile-comuna');
    const currentAddressEl = document.getElementById('current-address-display');
    const formDireccion = document.getElementById('form-direccion');

    // Lista de comunas por región (ampliada y similar a la usada en registro/login)
    const comunasPorRegion = {
        rm: ["Santiago","Puente Alto","Maipú","Las Condes","Ñuñoa"],
        valparaiso: ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana"],
        biobio: ["Concepción","Talcahuano","Chiguayante","Los Ángeles"],
        araucania: ["Temuco","Padre Las Casas","Villarrica","Pucón"],
        antofagasta: ["Antofagasta","Calama","Mejillones","Tocopilla"],
        metropolitana: ["Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquín","San Miguel","San Ramón","Santiago","Vitacura"]
    };

    // Poblar regiones y manejo de cambio para poblar comunas
    if (regionInput) {
        regionInput.innerHTML = '<option value="">Seleccione una región</option>';
        const regionLabels = { rm: 'Metropolitana', valparaiso: 'Valparaíso', biobio: 'Biobío', araucania: 'La Araucanía', antofagasta: 'Antofagasta', metropolitana: 'Metropolitana (alt)' };
        Object.keys(comunasPorRegion).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = regionLabels[key] || key;
            regionInput.appendChild(option);
        });

        regionInput.addEventListener('change', () => {
            const regionSeleccionada = regionInput.value;
            if (comunaInput) {
                comunaInput.innerHTML = '<option value="">Seleccione una comuna</option>';
                comunaInput.disabled = true;

                if (regionSeleccionada && comunasPorRegion[regionSeleccionada]) {
                    const lista = Array.isArray(comunasPorRegion[regionSeleccionada]) ? comunasPorRegion[regionSeleccionada] : (comunasPorRegion[regionSeleccionada].comunas || []);
                    lista.forEach(comuna => {
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

    // Usar datos de Firestore si existen, si no, los del localStorage
    const userDoc = await db.collection("usuario").doc(usuario.uid).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        if (nombreHeader) nombreHeader.textContent = data.nombre || usuario.nombre;
        if (nombreInput) nombreInput.value = data.nombre || '';
        if (apellidoInput) apellidoInput.value = data.apellido || ''; // Asumiendo que guardas apellido
        if (emailInput) emailInput.value = data.email || usuario.correo;
        if (telefonoInput) telefonoInput.value = data.telefono || '';

        // Cargar dirección si existe
        const direccion = data.direccion || data.shippingAddress || data.address || null;
        if (direccion) {
            if (calleInput) calleInput.value = direccion.calle || direccion.street || direccion.direccion || '';
            if (deptoInput) deptoInput.value = direccion.depto || direccion.departamento || direccion.numero || '';

            // Si hay region, asignarla y disparar evento para poblar comunas
            if (regionInput && (direccion.region || direccion.regionKey)) {
                // Función para intentar resolver una región a su key conocida
                function findRegionKey(regionValue) {
                    if (!regionValue) return '';
                    if (comunasPorRegion[regionValue]) return regionValue;
                    const labels = { rm: 'Metropolitana', valparaiso: 'Valparaíso', biobio: 'Biobío', araucania: 'La Araucanía', antofagasta: 'Antofagasta', metropolitana: 'Metropolitana (alt)' };
                    const found = Object.keys(labels).find(k => labels[k] === regionValue);
                    if (found) return found;
                    const found2 = Object.keys(comunasPorRegion).find(k => k.toLowerCase() === String(regionValue).toLowerCase());
                    if (found2) return found2;
                    return '';
                }

                const regionKey = direccion.regionKey || findRegionKey(direccion.region) || direccion.region || '';
                if (regionKey) {
                    regionInput.value = regionKey;
                    regionInput.dispatchEvent(new Event('change'));
                }
            }

            if (comunaInput && direccion.comuna) {
                // Esperar a que las comunas se poblen (si se hizo dispatchEvent)
                setTimeout(() => {
                    comunaInput.value = direccion.comuna;
                }, 80);
            }

            // Mostrar en la tarjeta de Dirección Actual
            if (currentAddressEl) {
                currentAddressEl.innerHTML = `
                    <p class="mb-0"><strong>${direccion.calle || direccion.street || ''}</strong> ${direccion.depto || direccion.departamento || ''}</p>
                    <p class="mb-0 text-muted">${direccion.comuna || ''}${direccion.region ? ', ' + (direccion.region) : ''}</p>
                    ${direccion.indicaciones ? `<p class="text-muted small">${direccion.indicaciones}</p>` : ''}
                `;
            }
        }

    } else {
        // Fallback con datos básicos del localStorage
        if (nombreHeader) nombreHeader.textContent = usuario.nombre;
        if (nombreInput) nombreInput.value = usuario.nombre;
        if (emailInput) emailInput.value = usuario.correo;
    }

    // 3. Configurar el botón de "Cerrar Sesión"
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            await auth.signOut();
            localStorage.removeItem("usuario");
            localStorage.removeItem("carrito"); // Limpiar también el carrito
            alert("Has cerrado sesión.");
            window.location.href = "../../index.html"; // Redirigir a la página de inicio
        });
    }

    // 4. Manejar envío del formulario de perfil (Guardar Cambios)
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = (document.getElementById('profile-nombre') || { value: '' }).value.trim();
            const apellido = (document.getElementById('profile-apellido') || { value: '' }).value.trim();
            const email = (document.getElementById('profile-email') || { value: '' }).value.trim();
            const telefono = (document.getElementById('profile-telefono') || { value: '' }).value.trim();

            // Validaciones básicas
            if (!nombre) {
                alert('El nombre es requerido.');
                return;
            }

            // Intentar obtener identificador del usuario desde localStorage (uid)
            const usuarioStr2 = localStorage.getItem('usuario');
            if (!usuarioStr2) {
                alert('No se encontró usuario en localStorage. Por favor inicia sesión.');
                return;
            }

            const usuario2 = JSON.parse(usuarioStr2);
            let docId = usuario2.uid || usuario2.id;
            // Si no hay docId intentamos buscar por email/correo en Firestore
            if (!docId) {
                const emailToSearch = usuario2.email || usuario2.correo;
                if (emailToSearch) {
                    try {
                        // Buscar por 'email'
                        let snapshot = await db.collection('usuario').where('email', '==', emailToSearch).get();
                        if (snapshot.empty) {
                            // Intentar por 'correo'
                            snapshot = await db.collection('usuario').where('correo', '==', emailToSearch).get();
                        }
                        if (!snapshot.empty) {
                            docId = snapshot.docs[0].id;
                        } else {
                            alert('No se encontró el documento del usuario en la base de datos.');
                            return;
                        }
                    } catch (err) {
                        console.error('Error buscando usuario por email:', err);
                        alert('Error al buscar usuario en la base de datos. Revisa la consola.');
                        return;
                    }
                } else {
                    alert('No se encontró el identificador del usuario (uid/id) ni email en localStorage.');
                    return;
                }
            }

            // Mostrar estado (deshabilitar botón)
            const submitBtn = formPerfil.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const updateData = { nombre };
                if (apellido) updateData.apellido = apellido;
                if (telefono) updateData.telefono = telefono;
                // Si el email no es readonly en la UI y viene, lo actualizamos también
                if (email) {
                    updateData.email = email;
                    updateData.correo = email; // compatibilidad con esquema mixto
                }

                // Usando SDK v8 style (db es firestore())
                await db.collection('usuario').doc(docId).update(updateData);

                // Actualizar localStorage para reflejar cambios inmediatos en la UI
                const nuevoUsuario = { ...usuario2, ...updateData };
                localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));

                alert('Perfil actualizado correctamente.');
            } catch (err) {
                console.error('Error actualizando perfil:', err);
                alert('Ocurrió un error al actualizar. Revisa la consola y permisos de Firestore.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Helper para mostrar la dirección actual en la UI
    function mostrarDireccionActual(direccion) {
        if (!currentAddressEl) return;
        if (!direccion) {
            currentAddressEl.innerHTML = '<p class="text-muted">No hay una dirección guardada.</p>';
            return;
        }
        currentAddressEl.innerHTML = `
            <p class="mb-0"><strong>${direccion.calle || direccion.street || ''}</strong> ${direccion.depto || direccion.departamento || ''}</p>
            <p class="mb-0 text-muted">${direccion.comuna || ''}${direccion.ciudad ? ', ' + direccion.ciudad : ''}</p>
            ${direccion.indicaciones ? `<p class="text-muted small">${direccion.indicaciones}</p>` : ''}
        `;
    }

    // Manejar envío del formulario de dirección
    if (formDireccion) {
        formDireccion.addEventListener('submit', async (e) => {
            e.preventDefault();

            const calle = (calleInput || { value: '' }).value.trim();
            const depto = (deptoInput || { value: '' }).value.trim();
            const comuna = (comunaInput || { value: '' }).value.trim();

            if (!calle || !comuna || !regionInput || !regionInput.value) {
                alert('Por favor completa al menos la calle, región y comuna.');
                return;
            }

            // Buscar docId del usuario (misma lógica que en perfil)
            const usuarioStr2 = localStorage.getItem('usuario');
            if (!usuarioStr2) {
                alert('No se encontró usuario en localStorage. Por favor inicia sesión.');
                return;
            }
            const usuario2 = JSON.parse(usuarioStr2);
            let docId = usuario2.uid || usuario2.id;

            try {
                if (!docId) {
                    const emailToSearch = usuario2.email || usuario2.correo;
                    if (emailToSearch) {
                        let snapshot = await db.collection('usuario').where('email', '==', emailToSearch).get();
                        if (snapshot.empty) snapshot = await db.collection('usuario').where('correo', '==', emailToSearch).get();
                        if (!snapshot.empty) docId = snapshot.docs[0].id;
                    }
                }

                if (!docId) {
                    alert('No se pudo identificar el documento del usuario para guardar la dirección.');
                    return;
                }

                const direccionObj = {
                    calle,
                    departamento: depto,
                    depto,
                    region: regionInput ? (regionInput.options[regionInput.selectedIndex].text || '') : '',
                    regionKey: regionInput ? (regionInput.value || '') : '',
                    comuna
                };

                await db.collection('usuario').doc(docId).set({ direccion: direccionObj }, { merge: true });

                // Actualizar UI y localStorage
                mostrarDireccionActual(direccionObj);
                const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
                usuarioLocal.direccion = direccionObj;
                localStorage.setItem('usuario', JSON.stringify(usuarioLocal));

                alert('Dirección guardada correctamente.');
            } catch (err) {
                console.error('Error guardando la dirección:', err);
                alert('Ocurrió un error al guardar la dirección. Revisa la consola.');
            }
        });
    }

    // Helper: escapar texto para atributos HTML
    function escapeHtml(text) {
        return String(text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Cargar historial de compras del usuario
    async function cargarHistorialCompras() {
        const tbody = document.getElementById('historial-compras-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando historial...</td></tr>';

        try {
            const query = db.collection('compras').where('usuarioId', '==', usuario.uid).orderBy('fecha', 'desc');
            const snapshot = await query.get();

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay pedidos aún.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            snapshot.forEach(doc => {
                const compra = doc.data();

                // Productos: mostrar solo nombres (concatenados) y título con la lista completa
                const productosArr = Array.isArray(compra.productos) ? compra.productos : [];
                const nombres = productosArr.map(p => (typeof p === 'string') ? p : (p.nombre || p.titulo || '')).filter(Boolean).join(', ');
                const displayNombres = nombres.length > 60 ? nombres.slice(0, 60) + '...' : nombres;

                const fecha = compra.fecha && typeof compra.fecha.toDate === 'function'
                    ? compra.fecha.toDate().toLocaleString()
                    : (compra.fecha ? new Date(compra.fecha).toLocaleString() : '—');
                const total = typeof compra.total === 'number' ? `$${compra.total.toLocaleString('es-CL')}` : (compra.total || '—');
                const estado = compra.estado || '—';

                const row = `
                    <tr>
                        <td title="${escapeHtml(nombres)}">${displayNombres || '—'}</td>
                        <td>${fecha}</td>
                        <td>${total}</td>
                        <td>${estado}</td>
                        <td><a class="btn btn-sm btn-outline-primary" href="compraExitosa.html?orden=${doc.id}">Ver</a></td>
                    </tr>`;

                tbody.innerHTML += row;
            });
        } catch (err) {
            console.error('Error cargando historial de compras:', err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Error al cargar historial. Revisa la consola.</td></tr>';
        }
    }

    // Llamada inicial para cargar el historial
    if (usuario && usuario.uid) cargarHistorialCompras();

});