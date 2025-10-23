document.addEventListener("DOMContentLoaded", () => {
    const contador = document.querySelector(".carrito-total");
    if (!contador) return;

    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const cantidadProductos = carrito.reduce((sum, producto) => {
        return sum + (producto.cantidad || 1);
    }, 0);

    contador.textContent = cantidadProductos;
});