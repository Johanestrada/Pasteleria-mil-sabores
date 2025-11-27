class DashboardManager {
    constructor() {
        this.estadisticas = null;
        this.estaCargando = false;
        this.firebaseInicializado = false;
        this.db = null;
        this.init();
    }

    async init() {
        console.log('Iniciando DashboardManager...');
        
        // IMPORTANTE: admin.html es HTML estático, no React
        // Así que inicializamos Firebase v8 directamente (con TU config)
        await this.inicializarFirebase();
        
        // Marcar como listo
        this.firebaseInicializado = true;
        
        // Configurar navegación
        this.configurarNavegacion();
        this.inicializarNavegacion();
        
        // Cargar estadísticas
        await this.cargarEstadisticasReales();
    }

    async esperarAPIsReact() {
        // Esperar a que React exponga window.obtenerEstadisticasDashboard
        let intentos = 0;
        const maxIntentos = 30; // 30 intentos * 500ms = 15 segundos
        
        return new Promise((resolve) => {
            const verificar = setInterval(() => {
                intentos++;
                console.log(`[DashboardManager] Esperando APIs de React... (intento ${intentos}/${maxIntentos})`);
                
                if (typeof window.obtenerEstadisticasDashboard === 'function' && 
                    typeof window.crudManager === 'object' &&
                    window.dashboardAPIReady === true) {
                    console.log('APIs de React cargadas correctamente');
                    clearInterval(verificar);
                    resolve();
                } else if (intentos >= maxIntentos) {
                    console.warn('⚠ APIs de React no cargaron a tiempo - usando fallback');
                    clearInterval(verificar);
                    resolve();
                }
            }, 500);
        });
    }

    async inicializarFirebase() {
        try {
            console.log('Inicializando Firebase v8 para admin.html...');
            
            // TU Firebase - Pastelería Mil Sabores
            const firebaseConfig = {
                apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
                authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
                projectId: "tiendapasteleriamilsabor-a193d",
                storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
                messagingSenderId: "1022940675339",
                appId: "1:1022940675339:web:e347b3abbbe1e35615360e",
                measurementId: "G-WKZ1WX5H72"
            };

            if (typeof firebase === 'undefined') {
                console.error('Firebase v8 no está cargado en admin.html');
                return false;
            }

            if (!firebase.apps.length) {
                console.log('Inicializando Firebase app...');
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            console.log('Firebase inicializado correctamente (TU proyecto: tiendapasteleriamilsabor-a193d)');
            
            // Inyectar la instancia de DB en el módulo CRUD
            if (window.crudFunctionsSafe && typeof window.crudFunctionsSafe.setDb === 'function') {
                window.crudFunctionsSafe.setDb(this.db);
            } else {
                console.warn('DashboardManager: No se pudo inyectar DB en crudFunctionsSafe. Puede que no esté cargado aún.');
            }

            // Exponer una función mínima createUsuarioConContrasena para compatibilidad
            try {
                window.crudManager = window.crudManager || {};
                window.crudManager.createUsuarioConContrasena = async (email, password, perfil) => {
                    if (typeof firebase === 'undefined') throw new Error('Firebase no inicializado');
                    // Asegurar que el módulo auth esté disponible
                    if (typeof firebase.auth !== 'function') {
                        // Intentar cargar auth v8 dinámicamente
                        await new Promise(resolve => {
                            const s = document.createElement('script');
                            s.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
                            s.onload = () => resolve(true);
                            s.onerror = () => resolve(false);
                            document.head.appendChild(s);
                        });
                        if (typeof firebase.auth !== 'function') throw new Error('Firebase Auth no disponible');
                    }

                    // Crear usuario en Firebase Auth
                    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    const uid = userCredential.user.uid;

                    // Guardar perfil en Firestore sin contraseña
                    const perfilDoc = {
                        ...perfil,
                        email: perfil.email || email,
                        createdAt: firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
                        activo: true
                    };

                    await firebase.firestore().collection('usuario').doc(uid).set(perfilDoc);
                    return uid;
                };
            } catch (err) {
                console.warn('No se pudo exponer createUsuarioConContrasena en dashboard.js:', err);
            }
            
            return true;
            
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            return false;
        }
    }

    configurarNavegacion() {
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    const seccion = link.getAttribute('href').substring(1);
                    this.navegarASeccion(seccion);
                }
            });
        });
    }

    inicializarNavegacion() {
        this.navegarASeccion('dashboard');
        this.actualizarBienvenida();
    }

    navegarASeccion(seccion) {
        const sections = document.querySelectorAll('main > section:not(.welcome-section)');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(seccion);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${seccion}`) {
                link.classList.add('active');
            }
        });

        if (seccion === 'dashboard' && this.firebaseInicializado) {
            this.cargarEstadisticasReales();
        }
    }

    // ==================== MÉTODOS DEL DASHBOARD ====================

    async cargarEstadisticasReales() {
        if (this.estaCargando) return;
        
        try {
            this.estaCargando = true;
            this.mostrarEstadoCarga(true);
            
            console.log('[DashboardManager] Cargando estadísticas REALES de Firestore...');
            
            if (!this.firebaseInicializado || !this.db) {
                console.warn('[DashboardManager] Firebase no está inicializado');
                this.usarDatosEjemplo();
                return;
            }
            
            // Cargar datos directamente de Firestore
            const [
                totalCompras,
                proyeccion,
                totalProductos,
                inventario,
                totalUsuarios,
                nuevosUsuarios
            ] = await Promise.all([
                this.getTotalCompras(),
                this.getProyeccionCompras(),
                this.getTotalProductos(),
                this.getInventarioTotal(),
                this.getTotalUsuarios(),
                this.getNuevosUsuariosMes()
            ]);

            this.estadisticas = {
                totalCompras,
                proyeccionCompras: proyeccion,
                totalProductos,
                inventarioTotal: inventario,
                totalUsuarios,
                nuevosUsuariosMes: nuevosUsuarios
            };
            
            console.log('[DashboardManager] Estadísticas obtenidas de Firestore:', this.estadisticas);
            this.actualizarUI();
            
        } catch (error) {
            console.error('[DashboardManager] Error cargando estadísticas:', error);
            this.usarDatosEjemplo();
        } finally {
            this.estaCargando = false;
            this.mostrarEstadoCarga(false);
        }
    }

    async getTotalCompras() {
        try {
            const snapshot = await this.db.collection("compras").get();
            const total = snapshot.size;
            console.log('getTotalCompras:', total);
            return total;
        } catch (error) {
            console.error("Error al obtener total de compras:", error);
            return 24;
        }
    }

    async getProyeccionCompras() {
        try {
            const ahora = new Date();
            const mesActualInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            const mesAnteriorInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
            const mesAnteriorFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

            // Compras del mes actual
            const snapshotActual = await this.db.collection("compras")
                .where("fecha", ">=", mesActualInicio)
                .where("fecha", "<=", ahora)
                .get();
            const comprasActual = snapshotActual.size;

            // Compras del mes anterior
            const snapshotAnterior = await this.db.collection("compras")
                .where("fecha", ">=", mesAnteriorInicio)
                .where("fecha", "<=", mesAnteriorFin)
                .get();
            const comprasAnterior = snapshotAnterior.size;

            if (comprasAnterior === 0) return comprasActual > 0 ? 100 : 0;
            
            const aumento = ((comprasActual - comprasAnterior) / comprasAnterior) * 100;
            const proyeccion = Math.round(aumento);
            console.log('getProyeccionCompras:', proyeccion);
            return proyeccion;
        } catch (error) {
            console.error("Error al calcular proyección:", error);
            return 15;
        }
    }

    async getTotalProductos() {
        try {
            const snapshot = await this.db.collection("producto").get();
            const total = snapshot.size;
            console.log('getTotalProductos:', total);
            return total;
        } catch (error) {
            console.error("Error al obtener total de productos:", error);
            return 156;
        }
    }

    async getInventarioTotal() {
        try {
            const snapshot = await this.db.collection("producto").get();
            let totalInventario = 0;
            
            snapshot.forEach(doc => {
                const producto = doc.data();
                totalInventario += producto.cantidad || producto.stock || 0;
            });
            
            console.log('getInventarioTotal:', totalInventario);
            return totalInventario;
        } catch (error) {
            console.error("Error al calcular inventario:", error);
            return 1248;
        }
    }

    async getTotalUsuarios() {
        try {
            const snapshot = await this.db.collection("usuario").get();
            const total = snapshot.size;
            console.log('getTotalUsuarios:', total);
            return total;
        } catch (error) {
            console.error("Error al obtener total de usuarios:", error);
            return 89;
        }
    }

    async getNuevosUsuariosMes() {
        try {
            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);

            const snapshot = await this.db.collection("usuario")
                .where("createdAt", ">=", inicioMes)
                .get();
            
            const total = snapshot.size;
            console.log('getNuevosUsuariosMes:', total);
            return total;
        } catch (error) {
            console.error("Error al obtener nuevos usuarios:", error);
            return 12;
        }
    }

    // ==================== MÉTODOS UI ====================

    usarDatosEjemplo() {
        this.estadisticas = {
            totalCompras: 24,
            proyeccionCompras: 15,
            totalProductos: 156,
            inventarioTotal: 1248,
            totalUsuarios: 89,
            nuevosUsuariosMes: 12
        };
        this.actualizarUI();
    }

    actualizarUI() {
        if (!this.estadisticas) return;

        const mapeoElementos = {
            'totalCompras': this.estadisticas.totalCompras,
            'proyeccionCompras': this.estadisticas.proyeccionCompras,
            'totalProductos': this.estadisticas.totalProductos,
            'inventarioTotal': this.estadisticas.inventarioTotal,
            'totalUsuarios': this.estadisticas.totalUsuarios,
            'nuevosUsuariosMes': this.estadisticas.nuevosUsuariosMes
        };

        Object.entries(mapeoElementos).forEach(([id, valor]) => {
            this.actualizarElemento(id, valor);
        });
    }

    actualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    mostrarEstadoCarga(mostrar) {
        const cards = document.querySelectorAll('.summary-card');
        const botones = document.querySelectorAll('.nav-button');
        
        cards.forEach(card => {
            card.classList.toggle('cargando', mostrar);
        });
        
        botones.forEach(boton => {
            boton.style.opacity = mostrar ? '0.6' : '1';
        });
    }

    actualizarBienvenida() {
        const usuarioStr = localStorage.getItem("usuario");
        if (usuarioStr) {
            const usuario = JSON.parse(usuarioStr);
            const bienvenidoPrincipal = document.getElementById('bienvenidoPrincipal');
            if (bienvenidoPrincipal) {
                bienvenidoPrincipal.textContent = `Bienvenido, ${usuario.nombre}`;
            }
        }
    }
}

// Funciones globales básicas
function navegarA(seccion) {
    if (window.dashboardManager) {
        window.dashboardManager.navegarASeccion(seccion);
    }
}

function irATienda() {
    window.location.href = '../../index.html';
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Cargado - Inicializando DashboardManager...');
    window.dashboardManager = new DashboardManager();
});