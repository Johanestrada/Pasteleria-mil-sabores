document.addEventListener("DOMContentLoaded", () => {

    const loginLink = document.getElementById('login-link');
    const userDropdown = document.getElementById('user-dropdown');
    const userNameSpan = document.getElementById('user-name');
    const logoutLinks = document.querySelectorAll('.logout-button, #logout-link');
    const dashboardLink = document.getElementById('dashboard-link');

    // Verificar si hay un usuario en localStorage
    const usuarioStr = localStorage.getItem("usuario");

    if (usuarioStr) {
        // Usuario está logueado
        const usuario = JSON.parse(usuarioStr);

        if (loginLink) loginLink.style.display = 'none'; // Ocultar enlace de login
        if (userDropdown) userDropdown.style.display = 'block'; // Mostrar menú de usuario
        if (userNameSpan) userNameSpan.textContent = usuario.nombre || 'Usuario'; // Mostrar nombre

        // Mostrar el enlace al dashboard según el rol
        if (dashboardLink && usuario.rol) {
            if (usuario.rol === 'admin') {
                dashboardLink.href = '/assets/page/admin.html';
                dashboardLink.style.display = 'block';
            } else if (usuario.rol === 'vendedor') {
                dashboardLink.href = '/assets/page/vendedor.html';
                dashboardLink.style.display = 'block';
            }
        }

        // Mostrar campana de notificaciones SOLO para clientes (no admin/vendedor)
        try {
            const pathname = window.location.pathname || '';
            const isIndexPage = pathname === '/' || pathname.endsWith('/index.html');
            if (!isIndexPage) {
                try { const wrapperRem = document.querySelector('.noti-wrapper'); if (wrapperRem) { wrapperRem.remove(); console.debug('auth-status: removed notification - not index'); } } catch (e) {}
            } else {
                const isCliente = !(usuario.rol === 'admin' || usuario.rol === 'vendedor');
            if (isCliente) {
                // Evitar duplicados
                if (!document.getElementById('notification-bell')) {
                    // Encontrar el ancla del carrito y añadir la campana a su lado
                    // Usar selectores flexibles para soportar enlaces absolutos y relativos
                    let carritoAnchor = document.querySelector('a[href$="/assets/page/carrito.html"]')
                        || document.querySelector('a[href$="/carrito.html"]')
                        || document.querySelector('a[href*="carrito"]')
                        || (document.querySelector('.bi-cart') ? document.querySelector('.bi-cart').closest('a') : null);
                    const parent = carritoAnchor ? carritoAnchor.parentElement : null;
                    // Preferir el contenedor derecho de la navbar si existe (mantiene consistencia entre páginas)
                    const navbarRight = document.querySelector('.navbar .d-flex.align-items-center.ms-lg-3') || document.querySelector('.navbar .d-flex');
                    const preferredContainer = navbarRight || (parent && parent.closest ? parent.closest('.d-flex') : null);
                    const insertionPoint = preferredContainer || parent || document.querySelector('#user-status-container') || document.body;

                    // Construir wrapper para campana + dropdown
                    const wrapper = document.createElement('div');
                    wrapper.className = 'noti-wrapper d-inline-block ms-2 noti-parent';

                    const btn = document.createElement('button');
                    btn.id = 'notification-bell';
                    btn.type = 'button';
                    btn.className = 'btn btn-light d-flex align-items-center position-relative';
                    btn.setAttribute('aria-label', 'Notificaciones');
                    btn.setAttribute('aria-expanded', 'false');
                    btn.innerHTML = '<i class="bi bi-bell fs-4"></i><span class="noti-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger visually-hidden"></span>';

                    // Dropdown de notificaciones (contenido inicial)
                    const dropdown = document.createElement('div');
                    dropdown.className = 'noti-dropdown';
                    dropdown.setAttribute('role', 'menu');
                    dropdown.innerHTML = `
                        <div class="noti-title">Tenemos estas ofertas para ti</div>
                        <ul class="noti-list list-unstyled mb-0">
                            <li class="noti-item">
                                <a href="/assets/page/ofertas.html#tortita" class="noti-link">Una tortita — Oferta especial</a>
                                <div class="noti-subtext">¡20% dto por tiempo limitado!</div>
                            </li>
                        </ul>
                        <div class="noti-footer text-end"><a href="/assets/page/ofertas.html" class="small">Ver todas las ofertas →</a></div>
                    `;

                    // Añadir elementos al DOM
                    wrapper.appendChild(btn);
                    wrapper.appendChild(dropdown);

                    // Añadir wrapper al DOM junto al carrito (usa insertionPoint). Si el contenedor es una fila, agregar al final para que se alinee con el carrito.
                    if (insertionPoint && insertionPoint.classList && insertionPoint.classList.contains('d-flex')) {
                        insertionPoint.appendChild(wrapper);
                        console.debug('auth-status: appended notification into d-flex container for consistent alignment');
                    } else if (insertionPoint && insertionPoint.parentNode && insertionPoint !== document.body && insertionPoint.parentNode.insertBefore) {
                        insertionPoint.parentNode.insertBefore(wrapper, insertionPoint.nextSibling);
                        console.debug('auth-status: notification inserted next to insertionPoint');
                    } else {
                        (document.querySelector('#user-status-container') || document.body).appendChild(wrapper);
                        console.debug('auth-status: notification inserted in fallback container');
                    }

                    // Asegurar que el elemento padre se marca para no atenuarse
                    try { if (parent) parent.classList.add('noti-parent'); } catch (e) {}

                    // Mostrar badge por defecto
                    const badge = btn.querySelector('.noti-badge');
                    if (badge) badge.classList.remove('visually-hidden');
                    console.debug('auth-status: badge shown for notification');

                    // Toggle open/close del dropdown
                    // Posicionar el dropdown exactamente bajo el botón para evitar problemas de overflow/layout
                    const positionDropdown = () => {
                        try {
                            // Mostrar temporalmente para medir
                            dropdown.style.display = 'block';
                            dropdown.style.visibility = 'hidden';
                            dropdown.style.position = 'fixed';

                            const rect = btn.getBoundingClientRect();
                            const ddWidth = Math.max(220, dropdown.offsetWidth || dropdown.scrollWidth || 260);
                            // Centrar el dropdown respecto al centro del boton para evitar que cubra el icono
                            let left = Math.round(rect.left + (rect.width / 2) - (ddWidth / 2));
                            // Evitar overflow izquierdo/derecho de la ventana
                            left = Math.max(8, Math.min(left, window.innerWidth - ddWidth - 8));
                            // Añadir separación extra para evitar solapamiento del icono en diseños con headers densos
                            const top = Math.round(rect.bottom + Math.max(16, rect.height * 0.25)); // separación dinámica

                            dropdown.style.left = left + 'px';
                            dropdown.style.top = top + 'px';
                            dropdown.style.minWidth = ddWidth + 'px';
                            // evitar que otras capas se superpongan
                            dropdown.style.zIndex = '1000000';
                            // limitar ancho en móviles
                            dropdown.style.maxWidth = Math.min(window.innerWidth - 16, 420) + 'px';

                            // Calcular posición de la flecha relativa al borde izquierdo del dropdown
                            const arrowCenter = Math.round(rect.left + rect.width / 2);
                            const arrowLeft = Math.max(12, Math.min(ddWidth - 12, arrowCenter - left));
                            dropdown.style.setProperty('--noti-arrow-left', arrowLeft + 'px');

                            // Restaurar visibilidad
                            dropdown.style.visibility = '';
                        } catch (err) {
                            console.warn('noti: could not position dropdown', err);
                        }
                    };

                    const openDropdown = (open) => {
                        if (open) {
                            wrapper.classList.add('open');
                            btn.setAttribute('aria-expanded', 'true');
                            document.body.classList.add('noti-open');
                            // apply fixed positioning to avoid being clipped by parent containers
                            dropdown.style.display = 'block';
                            dropdown.style.position = 'fixed';
                            dropdown.style.right = 'auto';
                            positionDropdown();
                            // Recalculate on resize/scroll while open
                            window.addEventListener('resize', positionDropdown);
                            window.addEventListener('scroll', positionDropdown, { passive: true });
                        } else {
                            wrapper.classList.remove('open');
                            btn.setAttribute('aria-expanded', 'false');
                            document.body.classList.remove('noti-open');
                            dropdown.style.display = 'none';
                            dropdown.style.position = '';
                            dropdown.style.left = '';
                            dropdown.style.top = '';
                            window.removeEventListener('resize', positionDropdown);
                            window.removeEventListener('scroll', positionDropdown, { passive: true });
                        }
                    };

                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDropdown(!wrapper.classList.contains('open'));
                    });

                    // Evitar que clics dentro del dropdown cierren inmediatamente
                    dropdown.addEventListener('click', (e) => { e.stopPropagation(); });

                    // Cerrar al click fuera o al presionar ESC
                    document.addEventListener('click', () => openDropdown(false));
                    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openDropdown(false); });

                    // Cuando se hace click en una noti-link, dejamos que la navegación ocurra naturalmente
                    dropdown.querySelectorAll('.noti-link').forEach(a => {
                        a.addEventListener('click', () => openDropdown(false));
                    });
                }
            }
        }
        } catch (err) {
            console.warn('Error al añadir campana de notificaciones:', err);
        }

    } else {
        // Usuario NO está logueado
        if (loginLink) loginLink.style.display = 'block'; // Asegurarse que el enlace de login esté visible
        if (userDropdown) userDropdown.style.display = 'none'; // Ocultar menú de usuario
        // Quitar campana de notificaciones (wrapper completo) si existe
        try {
            const wrapper = document.querySelector('.noti-wrapper');
            if (wrapper) { wrapper.remove(); console.debug('auth-status: removed noti-wrapper on logout'); }
        } catch (err) { /* noop */ }
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
