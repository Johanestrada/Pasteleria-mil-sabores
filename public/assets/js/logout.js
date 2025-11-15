// ==================== LOGOUT ====================

function cerrarSesion() {
    try {
        console.log('Cerrando sesión...');
        localStorage.removeItem('usuario');
        localStorage.removeItem('authToken');
        window.location.href = '../../index.html';
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
