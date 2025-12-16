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

    // Usar datos de Firestore si existen, si no, los del localStorage
    const userDoc = await db.collection("usuario").doc(usuario.uid).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        if (nombreHeader) nombreHeader.textContent = data.nombre || usuario.nombre;
        if (nombreInput) nombreInput.value = data.nombre || '';
        if (apellidoInput) apellidoInput.value = data.apellido || ''; // Asumiendo que guardas apellido
        if (emailInput) emailInput.value = data.email || usuario.correo;
        if (telefonoInput) telefonoInput.value = data.telefono || '';
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

});