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
    
    // Campos de dirección
    const calleInput = document.getElementById('profile-calle');
    const deptoInput = document.getElementById('profile-depto');
    const comunaInput = document.getElementById('profile-comuna');
    const ciudadInput = document.getElementById('profile-ciudad');

    // Intentar obtener datos desde Firestore por UID
    let data = null;
    if (usuario.uid) {
        const userDoc = await db.collection("usuario").doc(usuario.uid).get();
        if (userDoc.exists) data = userDoc.data();
    }

    // Si no se encontró por UID, buscar por correo (campo 'email' o 'correo')
    if (!data) {
        const correo = usuario.email || usuario.correo || usuario.mail;
        if (correo) {
            const q = await db.collection('usuario').where('email', '==', correo).get();
            if (q.empty) {
                // Try alternative field 'correo'
                const q2 = await db.collection('usuario').where('correo', '==', correo).get();
                if (!q2.empty) data = q2.docs[0].data();
            } else {
                data = q.docs[0].data();
            }
        }
    }

    // Merge datos: Firestore data tiene prioridad, luego localStorage 'usuario'
    const merged = { ...(usuario || {}), ...(data || {}) };

    // Rellenar campos visibles en el formulario
    if (nombreInput) nombreInput.value = merged.nombre || merged.nombreCompleto || '';
    if (apellidoInput) apellidoInput.value = merged.apellido || '';
    if (emailInput) emailInput.value = merged.email || merged.correo || usuario.correo || '';
    if (telefonoInput) telefonoInput.value = merged.telefono || merged.telefonoMovil || '';

    // Dirección: puede estar en 'direccion' (objeto), 'direcciones' (array) o en otras claves.
    function guessAddressFromObject(obj) {
        if (!obj || typeof obj !== 'object') return null;
        const addressKeys = ['calle', 'direccion', 'street', 'address', 'comuna', 'ciudad', 'city', 'numero', 'num', 'depto', 'departamento', 'postal', 'codigo'];

        // If object itself looks like an address
        const keys = Object.keys(obj).map(k => k.toLowerCase());
        const match = addressKeys.some(k => keys.includes(k));
        if (match) return obj;

        // Search nested objects / arrays for address-like objects
        for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (!v) continue;
            if (Array.isArray(v) && v.length > 0) {
                for (const item of v) {
                    if (item && typeof item === 'object') {
                        const itemKeys = Object.keys(item).map(ik => ik.toLowerCase());
                        if (addressKeys.some(ak => itemKeys.includes(ak))) return item;
                    }
                }
            } else if (typeof v === 'object') {
                const nested = guessAddressFromObject(v);
                if (nested) return nested;
            }º
        }

        return null;
    }

    let detectedAddress = null;
    if (merged.direccion && typeof merged.direccion === 'object') detectedAddress = merged.direccion;
    else if (Array.isArray(merged.direcciones) && merged.direcciones.length > 0) detectedAddress = merged.direcciones[0];
    else detectedAddress = guessAddressFromObject(merged);

    if (detectedAddress) {
        if (calleInput) calleInput.value = detectedAddress.calle || detectedAddress.street || detectedAddress.address || detectedAddress.direccion || '';
        if (deptoInput) deptoInput.value = detectedAddress.depto || detectedAddress.departamento || detectedAddress.numero || detectedAddress.num || '';
        if (comunaInput) comunaInput.value = detectedAddress.comuna || detectedAddress.neighborhood || '';
        if (ciudadInput) ciudadInput.value = detectedAddress.ciudad || detectedAddress.city || '';
    }

    // Actualizar encabezado si existe
    if (nombreHeader) nombreHeader.textContent = merged.nombre || merged.nombreCompleto || usuario.nombre || '';

    // Renderizar todos los datos del usuario en la tarjeta 'usuario-datos-completos'
    const datosCont = document.getElementById('usuario-datos-completos');
    if (datosCont) {
        // Mostrar solo los campos principales de forma legible (sin tabla JSON)
        let html = '';
        html += `<div class="mb-2"><strong>Nombre:</strong> ${merged.nombre || merged.nombreCompleto || ''}</div>`;
        html += `<div class="mb-2"><strong>Apellido:</strong> ${merged.apellido || ''}</div>`;
        html += `<div class="mb-2"><strong>Correo:</strong> ${merged.email || merged.correo || usuario.correo || ''}</div>`;
        html += `<div class="mb-2"><strong>Teléfono:</strong> ${merged.telefono || ''}</div>`;
        if (merged.rol) html += `<div class="mb-2"><strong>Rol:</strong> ${merged.rol}</div>`;

        if (detectedAddress) {
            const a = detectedAddress;
            html += `<div class="mt-3"><strong>Dirección de envío</strong>`;
            html += `<div class="small bg-light p-2 mt-2">`;
            if (a.calle || a.street || a.address) html += `<div>${a.calle || a.street || a.address} ${a.numero || a.num || ''}</div>`;
            if (a.depto || a.departamento) html += `<div>Depto/Casa: ${a.depto || a.departamento}</div>`;
            if (a.comuna) html += `<div>Comuna: ${a.comuna}</div>`;
            if (a.ciudad || a.city) html += `<div>Ciudad: ${a.ciudad || a.city}</div>`;
            if (a.postal) html += `<div>Código postal: ${a.postal}</div>`;
            html += `</div></div>`;
        }

        datosCont.innerHTML = html || '<p class="text-muted">No se encontraron datos adicionales del usuario.</p>';
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

            // Validaciones básicas
            if (!nombreInput.value.trim()) {
                alert('El nombre es requerido.');
                return;
            }

            // Mostrar estado (deshabilitar botón)
            const submitBtn = formPerfil.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const updateData = {
                    nombre: nombreInput.value.trim(),
                    apellido: apellidoInput.value.trim(),
                    telefono: telefonoInput.value.trim(),
                };

                // Usando SDK v8 style (db es firestore())
                await db.collection('usuario').doc(usuario.uid).update(updateData);

                // Actualizar localStorage para reflejar cambios inmediatos en la UI
                const nuevoUsuario = { ...usuario, ...updateData };
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

    // 5. Manejar envío del formulario de dirección
    const formDireccion = document.getElementById('form-direccion');
    if (formDireccion) {
        formDireccion.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!calleInput.value.trim() || !comunaInput.value.trim() || !ciudadInput.value.trim()) {
                alert('Por favor, completa la calle, comuna y ciudad.');
                return;
            }

            const submitBtn = formDireccion.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const direccionData = {
                    calle: calleInput.value.trim(),
                    depto: deptoInput.value.trim(),
                    comuna: comunaInput.value.trim(),
                    ciudad: ciudadInput.value.trim(),
                };
                // Usamos .set con { merge: true } para crear o actualizar el campo 'direccion' sin borrar otros datos.
                await db.collection('usuario').doc(usuario.uid).set({
                    direccion: direccionData
                }, { merge: true });

                // Actualizar localStorage para reflejar el cambio
                const usuarioActualizado = { ...JSON.parse(localStorage.getItem("usuario")), direccion: direccionData };
                localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

                // Actualizar la vista de la dirección actual
                const currentAddressDisplay = document.getElementById('current-address-display');
                if (currentAddressDisplay) {
                    currentAddressDisplay.innerHTML = `
                        <p><strong>Calle:</strong> ${direccionData.calle || ''}</p>
                        <p><strong>Departamento/Casa:</strong> ${direccionData.depto || ''}</p>
                        <p><strong>Comuna:</strong> ${direccionData.comuna || ''}</p>
                        <p><strong>Ciudad:</strong> ${direccionData.ciudad || ''}</p>
                    `;
                }

                alert('Dirección guardada correctamente.');
            } catch (error) {
                console.error('Error al guardar la dirección:', error);
                alert('Ocurrió un error al guardar la dirección.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // 6. Cargar historial de compras
    const historialBody = document.getElementById('historial-compras-body');
    if (historialBody) {
        await cargarHistorialCompras(db, usuario.uid, historialBody);
    }
});

async function cargarHistorialCompras(db, usuarioId, tbody) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando historial...</td></tr>';

    try {
        const comprasSnapshot = await db.collection('compras')
            .where('usuarioId', '==', usuarioId)
            .orderBy('fecha', 'desc')
            .get();

        if (comprasSnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Aún no has realizado ninguna compra.</td></tr>';
            return;
        }

        let html = '';
        comprasSnapshot.forEach(doc => {
            const compra = doc.data();
            const fecha = compra.fecha.toDate().toLocaleDateString('es-CL');
            const total = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(compra.total);
            
            const estado = compra.estado || 'Desconocido';
            const badgeClass = {
                'entregado': 'bg-success',
                'en preparación': 'bg-warning text-dark',
                'en preparacion': 'bg-warning text-dark',
                'enviado': 'bg-info text-dark',
                'cancelado': 'bg-danger',
            }[estado.toLowerCase()] || 'bg-secondary';

            html += `<tr>
                        <th scope="row">#${doc.id.substring(0, 6)}</th>
                        <td>${fecha}</td>
                        <td>${total}</td>
                        <td><span class="badge ${badgeClass}">${estado}</span></td>
                        <td><button class="btn btn-sm btn-outline-primary" data-id="${doc.id}">Ver Detalle</button></td>
                    </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error("Error al cargar el historial de compras: ", error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Error al cargar el historial. Inténtalo más tarde.</td></tr>';
    }
}