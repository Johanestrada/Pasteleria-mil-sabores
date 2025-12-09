// ofertas.js
// Carga y renderiza los productos en oferta (mismo estilo que el catálogo)

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
    authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
    projectId: "tiendapasteleriamilsabor-a193d",
  };

  if (!window.firebase) {
    console.error('Firebase no está disponible en esta página. Asegúrate de incluir el SDK antes.');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  let ofertasGlobal = [];

  document.addEventListener('DOMContentLoaded', () => {
    cargarOfertas();
  });

  async function cargarOfertas() {
    try {
      const snapshot = await db.collection('producto').where('precioAnterior', '>', 0).get();
      ofertasGlobal = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderizarOfertas(ofertasGlobal);
    } catch (err) {
      console.error('Error cargando ofertas:', err);
      const cont = document.getElementById('productosOferta');
      if (cont) cont.innerHTML = '<p>No se pudo cargar las ofertas. Intenta recargar.</p>';
    }
  }

  function renderizarOfertas(productos) {
    const cont = document.getElementById('productosOferta');
    if (!cont) return;

    if (!productos || productos.length === 0) {
      cont.innerHTML = '<p>No hay productos en oferta en este momento.</p>';
      return;
    }

    cont.innerHTML = productos.map(p => {
      const precio = Number(p.precio) || 0;
      const precioAnterior = Number(p.precioAnterior) || 0;
      const mostrarAnterior = precioAnterior > 0 && precioAnterior > precio;
      const ahorro = mostrarAnterior ? Math.round(((precioAnterior - precio) / precioAnterior) * 100) : 0;

      return `
      <div class="producto-card">
        <img src="${p.imagen || 'https://via.placeholder.com/400x300/cccccc/969696?text=Imagen+No+Disponible'}"
             alt="${p.nombre || ''}" class="producto-imagen">
        <div class="producto-info">
          <h3 class="producto-nombre">${p.nombre || 'Sin nombre'}</h3>
          <div class="precios-oferta">
            ${mostrarAnterior ? `<span class="precio-anterior">$${precioAnterior.toLocaleString('es-CL')}</span>` : ''}
            <span class="producto-precio">$${precio.toLocaleString('es-CL')}</span>
            ${mostrarAnterior ? `<span class="badge bg-danger ms-2">-${ahorro}%</span>` : ''}
          </div>
          <p class="producto-stock">Stock: ${p.stock ?? 0}</p>
          <button class="btn-agregar" data-id="${p.id}">🛒 Agregar</button>
        </div>
      </div>
    `;
    }).join('');

    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', () => agregarAlCarritoOfertas(btn.dataset.id));
    });
  }

  function mostrarNotificacion(mensaje, tipo = 'success') {
    const noti = document.createElement('div');
    noti.style.cssText = `position: fixed; top: 100px; right: 20px; background: ${tipo === 'success' ? '#28a745' : '#dc3545'}; color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); font-weight: 600; z-index: 10000;`;
    noti.textContent = mensaje;
    document.body.appendChild(noti);
    setTimeout(() => noti.remove(), 3000);
  }

  async function agregarAlCarritoOfertas(id) {
    const producto = ofertasGlobal.find(p => p.id === id);
    if (!producto) return;

    const stock = producto.stock ?? 0;
    if (stock <= 0) {
      mostrarNotificacion('Producto sin stock disponible', 'error');
      return;
    }

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const existente = carrito.find(i => i.id === id);
    if (existente) {
      existente.cantidad = (existente.cantidad || 1) + 1;
    } else {
      carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Actualizar contador del header si existe
    const contador = document.querySelector('.carrito-total');
    if (contador) {
      const total = carrito.reduce((s, it) => s + ((it.cantidad || 1)), 0);
      contador.textContent = total;
    }

    mostrarNotificacion(`"${producto.nombre}" agregado al carrito`);

    // Actualizar stock en Firebase
    try {
      const ref = db.collection('producto').doc(id);
      const docSnap = await ref.get();
      if (docSnap.exists) {
        const nuevoStock = (docSnap.data().stock || 0) - 1;
        await ref.update({ stock: nuevoStock });
      }
    } catch (err) {
      console.error('Error actualizando stock al agregar desde ofertas:', err);
    }
  }

})();
