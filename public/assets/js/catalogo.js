document.addEventListener("DOMContentLoaded", () => {
  // ==== ELEMENTOS DEL DOM ====
  const dropdownCategorias = document.getElementById("dropdownCategorias");
  const cardsCategorias = document.getElementById("cardsCategorias");
  const productosGrid = document.getElementById("productosGrid");
  const tituloProductos = document.getElementById("tituloProductos");
  const buscador = document.getElementById("buscador");
  const btnBuscar = document.getElementById("btnBuscar");
  const carritoTotal = document.querySelector('.carrito-total');
  const btnVerTodos = document.getElementById("btnVerTodos");
  const btnCarrito = document.querySelector('.btn-carrito');

  // ==== VARIABLES GLOBALES ====
  let productosGlobal = [];
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  let categoriaActiva = 'todos';

  // ==== CONFIGURACIÓN DE FIREBASE ====
  const firebaseConfig = {
    apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
    authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
    projectId: "tiendapasteleriamilsabor-a193d",
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ==== INICIALIZAR APLICACIÓN ====
  actualizarCarritoTotal();
  cargarProductos();

  // ==== CARGAR PRODUCTOS DESDE FIRESTORE ====
  async function cargarProductos() {
    try {
      if (tituloProductos) tituloProductos.textContent = "Cargando productos...";

      const snapshot = await db.collection("producto").get();
      productosGlobal = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("=== DEBUG STOCK EN FIREBASE ===");
      productosGlobal.forEach((producto, i) => {
        console.log(`Producto ${i}:`, {
          nombre: producto.nombre,
          stock: producto.stock,
          tipoStock: typeof producto.stock,
          id: producto.id
        });
      });

      console.log("Productos completos:", productosGlobal);
      inicializarInterfaz(productosGlobal);

      // Si existe un query param `q`, ejecutamos la búsqueda ahora que los productos ya están cargados
      try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q && buscador) {
          buscador.value = q;
          // Ejecutar búsqueda después de breve tick para asegurar interfaz lista
          setTimeout(() => buscarProductos(), 50);
        }
      } catch (err) {
        console.warn('No se pudo procesar query param q para búsqueda', err);
      }

    } catch (error) {
      console.error("Error cargando productos:", error);
      if (tituloProductos) tituloProductos.textContent = "Error al cargar productos";
      if (productosGrid)
        productosGrid.innerHTML = `<p class='error'>No se pudieron cargar los productos. Intenta recargar la página.</p>`;
    }
  }

  // ==== INICIALIZAR INTERFAZ ====
  function inicializarInterfaz(productos) {
    const categorias = obtenerCategoriasUnicas(productos);

    mostrarDropdownCategorias(categorias);
    mostrarCardsCategorias(categorias);
    mostrarTodosLosProductos();

    configurarEventos();
    escucharCambiosStock();
  }

  // ==== OBTENER CATEGORÍAS ÚNICAS ====
  function obtenerCategoriasUnicas(productos) {
    const categorias = new Set();
    productos.forEach(p => {
      if (p.categoria) categorias.add(p.categoria);
    });
    return Array.from(categorias);
  }

  // ==== DROPDOWN DE CATEGORÍAS ====
  function mostrarDropdownCategorias(categorias) {
    if (!dropdownCategorias) return;
    dropdownCategorias.innerHTML = categorias.map(c => `
      <a href="#" class="dropdown-item" data-categoria="${c}">${c}</a>
    `).join("");

    dropdownCategorias.addEventListener("click", e => {
      e.preventDefault();
      if (e.target.classList.contains("dropdown-item")) {
        filtrarPorCategoria(e.target.dataset.categoria);
      }
    });
  }

  // ==== CARDS DE CATEGORÍAS ====
  function mostrarCardsCategorias(categorias) {
    if (!cardsCategorias) return;
    cardsCategorias.innerHTML = categorias.map(c => `
      <div class="categoria-card" data-categoria="${c}">
        <div class="categoria-img">${obtenerIconoCategoria(c)}</div>
        <div class="categoria-nombre">${c}</div>
      </div>
    `).join("");

    cardsCategorias.addEventListener("click", e => {
      const card = e.target.closest(".categoria-card");
      if (card) filtrarPorCategoria(card.dataset.categoria);
    });
  }

  // ==== ICONOS DE CATEGORÍAS ====
  function obtenerIconoCategoria(categoria) {
    const iconos = {
      'Ropa': '👕', 'Tecnología': '💻', 'Electrónica': '📱',
      'Hogar': '🏠', 'Deportes': '⚽', 'Zapatos': '👟',
      'Accesorios': '🕶️', 'Libros': '📚', 'Juguetes': '🧸', 'Belleza': '💄'
    };
    return iconos[categoria] || '🍰';
  }

  // ==== FILTRAR PRODUCTOS POR CATEGORÍA ====
  function filtrarPorCategoria(categoria) {
    const productosFiltrados = productosGlobal.filter(p => p.categoria === categoria);
    if (tituloProductos)
      tituloProductos.textContent = `${categoria} (${productosFiltrados.length})`;
    categoriaActiva = categoria;
    mostrarProductos(productosFiltrados);
  }

  // ==== MOSTRAR TODOS LOS PRODUCTOS ====
  function mostrarTodosLosProductos() {
    if (tituloProductos)
      tituloProductos.textContent = `Todos los productos (${productosGlobal.length})`;
    categoriaActiva = 'todos';
    mostrarProductos(productosGlobal);

    if (buscador) buscador.value = ''; // Evita error si no existe
  }

  // ==== RENDERIZAR PRODUCTOS ====
  function mostrarProductos(productos) {
    if (!productosGrid) return;
    if (productos.length === 0) {
      productosGrid.innerHTML = `
        <div class="no-productos" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="font-size: 18px; color: #666;">No se encontraron productos</p>
          <button class="btn-signup" onclick="mostrarTodosLosProductos()">Ver todos</button>
        </div>`;
      return;
    }

    productosGrid.innerHTML = productos.map(p => `
      <div class="producto-card">
        <img src="${p.imagen || 'https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'}"
             alt="${p.nombre}" class="producto-imagen">
        <div class="producto-info">
          <h3 class="producto-nombre">${p.nombre || 'Sin nombre'}</h3>
          <p class="producto-precio">$${(p.precio || 0).toLocaleString('es-CL')}</p>
          <p class="producto-stock">Stock: ${p.stock ?? 0}</p>
          <button class="btn-agregar" data-id="${p.id}">🛒 Agregar</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".btn-agregar").forEach(btn => {
      btn.addEventListener("click", () => agregarAlCarrito(btn.dataset.id));
    });
  }

  // ==== AGREGAR AL CARRITO ====
  function agregarAlCarrito(id) {
    const producto = productosGlobal.find(p => p.id === id);
    if (!producto) return;

    const stockActual = producto.stock ?? 100;
    if (stockActual <= 0) {
      mostrarNotificacion("Producto sin stock disponible", "error");
      return;
    }

    const existente = carrito.find(i => i.id === id);
    if (existente) {
      existente.cantidad = (existente.cantidad || 1) + 1;
    } else {
      carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarritoTotal();
    actualizarStockFirebase(id, 1);
    mostrarNotificacion(`"${producto.nombre}" agregado al carrito`);
  }

  // ==== ACTUALIZAR TOTAL DEL CARRITO ====
  function actualizarCarritoTotal() {
    if (!carritoTotal) return;
    const total = carrito.reduce((sum, p) => sum + ((p.precio || 0) * (p.cantidad || 1)), 0);
    carritoTotal.textContent = total.toLocaleString("es-CL");
  }

  // ==== NOTIFICACIÓN ====
  function mostrarNotificacion(mensaje, tipo = "success") {
    const noti = document.createElement("div");
    noti.style.cssText = `
      position: fixed; top: 100px; right: 20px;
      background: ${tipo === "success" ? "#28a745" : "#dc3545"};
      color: white; padding: 15px 20px; border-radius: 5px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2); font-weight: 600;
      z-index: 10000; transition: all 0.3s ease;
    `;
    noti.textContent = mensaje;
    document.body.appendChild(noti);
    setTimeout(() => noti.remove(), 3000);
  }

  // ==== CONFIGURAR EVENTOS ====
  function configurarEventos() {
    if (btnVerTodos) btnVerTodos.addEventListener("click", mostrarTodosLosProductos);
    if (btnBuscar) btnBuscar.addEventListener("click", buscarProductos);
    if (buscador) buscador.addEventListener("keypress", e => {
      if (e.key === "Enter") buscarProductos();
    });
    if (btnCarrito) btnCarrito.addEventListener("click", () => window.location.href = "carrito.html");
  }

  // ==== BUSCAR PRODUCTOS ====
  function buscarProductos() {
    const termino = buscador?.value.toLowerCase().trim() || "";
    if (!termino) {
      categoriaActiva === "todos" ? mostrarTodosLosProductos() : filtrarPorCategoria(categoriaActiva);
      return;
    }

    const filtrados = productosGlobal.filter(p =>
      p.nombre?.toLowerCase().includes(termino) ||
      p.categoria?.toLowerCase().includes(termino) ||
      p.descripcion?.toLowerCase().includes(termino)
    );

    if (tituloProductos)
      tituloProductos.textContent = `Resultados para "${termino}" (${filtrados.length})`;
    mostrarProductos(filtrados);
  }

  // ==== ACTUALIZAR STOCK EN FIREBASE ====
  async function actualizarStockFirebase(id, cantidad) {
    try {
      const ref = db.collection("producto").doc(id);
      const docSnap = await ref.get();
      if (!docSnap.exists) return;

      const nuevoStock = (docSnap.data().stock || 0) - cantidad;
      await ref.update({ stock: nuevoStock });
      console.log(`Stock actualizado: ${docSnap.data().nombre} - ${nuevoStock}`);
    } catch (err) {
      console.error("Error actualizando stock en Firebase:", err);
    }
  }

  // ==== ESCUCHAR CAMBIOS EN TIEMPO REAL ====
  function escucharCambiosStock() {
    db.collection("producto").onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "modified") {
          const actualizado = { id: change.doc.id, ...change.doc.data() };
          const index = productosGlobal.findIndex(p => p.id === actualizado.id);
          if (index !== -1) {
            productosGlobal[index] = actualizado;
            if (categoriaActiva === "todos" || actualizado.categoria === categoriaActiva)
              mostrarProductos(categoriaActiva === "todos"
                ? productosGlobal
                : productosGlobal.filter(p => p.categoria === categoriaActiva)
              );
          }
        }
      });
    });
  }

  console.log("Catálogo inicializado correctamente");
  // (nota) la búsqueda por query se maneja después de cargar productos para evitar condiciones de carrera
});
