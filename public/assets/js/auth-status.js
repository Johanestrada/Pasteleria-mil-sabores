document.addEventListener("DOMContentLoaded", () => {

    const loginLink = document.getElementById('login-link');
    const userDropdown = document.getElementById('user-dropdown');
    const userNameSpan = document.getElementById('user-name');
    const logoutLinks = document.querySelectorAll('.logout-button');

    // Verificar si hay un usuario en localStorage
    const usuarioStr = localStorage.getItem("usuario");

    if (usuarioStr) {
        // Usuario está logueado
        const usuario = JSON.parse(usuarioStr);

        if (loginLink) loginLink.style.display = 'none'; // Ocultar enlace de login
        if (userDropdown) userDropdown.style.display = 'block'; // Mostrar menú de usuario
        if (userNameSpan) userNameSpan.textContent = usuario.nombre || 'Usuario'; // Mostrar nombre

    } else {
        // Usuario NO está logueado
        if (loginLink) loginLink.style.display = 'block'; // Asegurarse que el enlace de login esté visible
        if (userDropdown) userDropdown.style.display = 'none'; // Ocultar menú de usuario
    }

    // Configurar el botón de cerrar sesión
    if (logoutLinks.length > 0) {
        logoutLinks.forEach(logoutLink => {
            logoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                // Solo si Firebase está disponible, intenta cerrar sesión.
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    try {
                        await firebase.auth().signOut();
                    } catch (error) {
                        console.error('Error al cerrar sesión en Firebase:', error);
                    }
                }
                // Limpieza y redirección se hacen siempre.
                localStorage.removeItem('usuario');
                localStorage.removeItem('carrito');
                alert('Has cerrado sesión.');
                window.location.href = '/index.html';
            });
        });
    }
});
