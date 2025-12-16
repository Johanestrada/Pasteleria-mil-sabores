class VendedorDashboard {
    constructor() {
        this.db = null;
        this.firebaseInicializado = false;
        this.init();
    }

    async init() {
        console.log('Iniciando VendedorDashboard...');
        
        // Inicializar Firebase
        await this.inicializarFirebase();
        
        // Configurar navegación
        this.configurarNavegacion();
        this.inicializarNavegacion();
        
        // Cargar estadísticas
        await this.cargarEstadisticasVendedor();
        
        // Cargar categorías para filtro
        if (vendedorFunctions) {
            vendedorFunctions.cargarCategorias();
        }
    }

    async inicializarFirebase() {
        try {
            console.log('Inicializando Firebase...');
            
            const firebaseConfig = {
                apiKey: "AIzaSyC8PHMRL_Z3q36hzJP0b_Nk7b0VwzHT_wE",
                authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
                projectId: "tiendapasteleriamilsabor-a193d",
                storageBucket: "tiendapasteleriamilsabor-a193d.appspot.com",
                messagingSenderId: "656849405849",
                appId: "1:656849405849:web:8f8e96f40fa44c6f37d8e9",
                measurementId: "G-5KQN1TN9K2"
            };

            if (typeof firebase === 'undefined') {
                console.error('Firebase no está cargado');
                return false;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.db = firebase.firestore();
            this.firebaseInicializado = true;
            
            console.log('Firebase inicializado correctamente');
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
    }

    navegarASeccion(seccion) {
        // Mostrar la sección 'tienda' dentro del dashboard y rellenarla según el rol
        if (seccion === 'tienda') {
            const rol = localStorage.getItem('rol');
            const tiendaSection = document.getElementById('tienda');
            const googleLink = 'https://www.google.com/search?newwindow=1&sca_esv=8efe466fbfa838b2&q=Paradero+37+Av.Concha+y+Toro&ludocid=9472218623307551877&lsig=AB86z5XKoVh6NMu83UsDLIEu8fAb&sa=X&sqi=2&ved=2ahUKEwiFtvGkw8GRAxUiqZUCHWS1N00Q8G0oAHoECCUQAQ';
            const mapsEmbed = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.123456789012!2d-70.650123456789!3d-33.456789012345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662c1234567890%3A0xabcdef1234567890!2sPasteler%C3%ADa%20Mil%20Sabores!5e0!3m2!1ses-419!2scl!4v1699999999999!5m2!1ses-419!2scl';

            if (tiendaSection) {
                // Igualar apariencia para admin y vendedor: mostrar siempre el mapa embebido (no la página completa)
                tiendaSection.querySelector('.welcome-subtitle').textContent = (rol === 'admin' || rol === 'vendedor') ? 'Vista interna de la tienda' : 'Ubicación de la tienda';
                const iframe = tiendaSection.querySelector('.tienda-iframe');
                if (iframe) {
                    iframe.src = mapsEmbed; // usar siempre el mapa embebido para evitar cargar la página completa
                }
            } else {
                console.warn('Sección tienda no encontrada en el DOM');
            }
        }

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

        // Auto-cargar datos cuando se navega a secciones
        try {
            if (seccion === 'ordenes' && typeof cargarOrdenesVendedor === 'function') {
                cargarOrdenesVendedor();
            }
            if (seccion === 'productos' && typeof cargarProductosVendedor === 'function') {
                cargarProductosVendedor();
            }
            if (seccion === 'dashboard' && this.firebaseInicializado) {
                this.cargarEstadisticasVendedor();
            }
        } catch (err) {
            console.warn('Error auto-cargando módulo al navegar:', err);
        }
    }

    // Cargar estadísticas del dashboard
    async cargarEstadisticasVendedor() {
        try {
            console.log('Cargando estadísticas del vendedor...');
            
            // Obtener mes actual
            const ahora = new Date();
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

            const [comprasData, productosData] = await Promise.all([
                this.obtenerOrdenesDelMes(inicioMes, finMes),
                this.obtenerProductosActivos()
            ]);

            this.mostrarEstadisticas(comprasData, productosData);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.mostrarErrorEstadisticas();
        }
    }

    async obtenerOrdenesDelMes(fechaInicio, fechaFin) {
        try {
            const snapshot = await this.db.collection('compras')
                .where('fecha', '>=', fechaInicio)
                .where('fecha', '<=', fechaFin)
                .get();

            let totalCompras = 0;
            let totalVentas = 0;
            let ordenesPendientes = 0;

            snapshot.forEach(doc => {
                totalCompras++;
                const orden = doc.data();
                totalVentas += orden.total || 0;
                if (orden.estado === 'pendiente') {
                    ordenesPendientes++;
                }
            });

            return {
                totalCompras,
                totalVentas,
                ordenesPendientes
            };
        } catch (error) {
            console.error('Error obteniendo órdenes del mes:', error);
            return { totalCompras: 0, totalVentas: 0, ordenesPendientes: 0 };
        }
    }

    async obtenerProductosActivos() {
        try {
            const snapshot = await this.db.collection('producto').get();

            let totalProductos = 0;
            let inventarioTotal = 0;

            snapshot.forEach(doc => {
                const producto = doc.data();
                if (producto.activo !== false) {
                    totalProductos++;
                    inventarioTotal += producto.stock || 0;
                }
            });

            return {
                totalProductos,
                inventarioTotal
            };
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            return { totalProductos: 0, inventarioTotal: 0 };
        }
    }

    mostrarEstadisticas(comprasData, productosData) {
        // Actualizar cards
        document.getElementById('totalOrdenesMes').textContent = comprasData.totalCompras;
        document.getElementById('totalVentasMes').textContent = `$${comprasData.totalVentas.toFixed(2)}`;
        
        document.getElementById('totalProductos').textContent = productosData.totalProductos;
        document.getElementById('inventarioTotal').textContent = productosData.inventarioTotal;
        
        document.getElementById('ordenesPendientes').textContent = comprasData.ordenesPendientes;
    }

    mostrarErrorEstadisticas() {
        const elementosError = {
            'totalOrdenesMes': '0',
            'totalVentasMes': '$0',
            'totalProductos': '0',
            'inventarioTotal': '0',
            'ordenesPendientes': '0'
        };
        
        for (const [id, valor] of Object.entries(elementosError)) {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        }
    }
}

// Instancia global
let vendedorDashboard = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    vendedorDashboard = new VendedorDashboard();
});
