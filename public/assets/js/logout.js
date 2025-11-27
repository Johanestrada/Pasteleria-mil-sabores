// ==================== LOGOUT ====================

// ==================== LOGOUT ====================

function cerrarSesion() {
    try {
        console.log('Cerrando sesión...');
        // Solo si Firebase está disponible, intenta cerrar sesión.
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                firebase.auth().signOut();
            } catch (error) {
                console.error('Error al cerrar sesión en Firebase:', error);
            }
        }
        // Limpieza y redirección se hacen siempre.
        localStorage.removeItem('usuario');
        localStorage.removeItem('carrito');
        localStorage.removeItem('authToken');
        alert('Has cerrado sesión.');
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Configurar botones de logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    });
});
