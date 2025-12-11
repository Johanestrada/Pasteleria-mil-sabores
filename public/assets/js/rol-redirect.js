function redirectPorRol() {
    try {
        const usuarioStr = localStorage.getItem('usuario');
        const rol = localStorage.getItem('rol');

        if (!usuarioStr) {
            window.location.href = '/page/login.html';
            return;
        }

        const usuario = JSON.parse(usuarioStr);
        
        // Redirigir según el rol
        switch(rol) {
            case 'admin':
                window.location.href = '/page/admin.html';
                break;
            case 'vendedor':
                window.location.href = '/page/vendedor.html';
                break;
            case 'cliente':
            default:
                window.location.href = '/page/usuario.html';
                break;
        }
    } catch (error) {
        console.error('Error en redirección por rol:', error);
        window.location.href = '/page/login.html';
    }
}

// Verificar permiso de acceso a página
function verificarPermisoPagina(rolesPermitidos) {
    try {
        const rol = localStorage.getItem('rol');
        const usuario = localStorage.getItem('usuario');

        if (!usuario || !rol) {
            window.location.href = '/page/login.html';
            return false;
        }

        if (!rolesPermitidos.includes(rol)) {
            alert('No tienes permiso para acceder a esta página');
            redirectPorRol();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verificando permisos:', error);
        window.location.href = '/page/login.html';
        return false;
    }
}

// Ejecutar redirección cuando se carga la página de bienvenida
window.addEventListener('load', () => {
    // Solo hacer la redirección si no estamos ya en un panel específico
    const pathname = window.location.pathname.toLowerCase();
    
    // Si está en login, no redirigir
    if (pathname.includes('login') || pathname.includes('registro')) {
        return;
    }

    // Si está en una página específica (admin, vendedor, usuario), verificar permisos
    if (pathname.includes('/page/admin.html')) {
        verificarPermisoPagina(['admin']);
    } else if (pathname.includes('/page/vendedor.html')) {
        verificarPermisoPagina(['vendedor']);
    } else if (pathname.includes('/page/usuario.html')) {
        verificarPermisoPagina(['cliente']);
    }
});
