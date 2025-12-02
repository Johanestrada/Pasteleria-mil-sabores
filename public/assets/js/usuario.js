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

    // Usar datos de Firestore si existen, si no, los del localStorage
    const userDoc = await db.collection("usuario").doc(usuario.uid).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        if (nombreInput) nombreInput.value = data.nombre || '';
        if (apellidoInput) apellidoInput.value = data.apellido || ''; // Asumiendo que guardas apellido
        if (emailInput) emailInput.value = data.email || usuario.correo;
        if (telefonoInput) telefonoInput.value = data.telefono || '';
        if (data.direccion) {
            if (calleInput) calleInput.value = data.direccion.calle || '';
            if (deptoInput) deptoInput.value = data.direccion.depto || '';
            if (comunaInput) comunaInput.value = data.direccion.comuna || '';
            if (ciudadInput) ciudadInput.value = data.direccion.ciudad || '';
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
