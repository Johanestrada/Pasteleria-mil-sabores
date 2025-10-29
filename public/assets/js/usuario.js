document.addEventListener("DOMContentLoaded", async () => {
    // Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAHAFW0zClY_Snm0tUWnF6n-VuKCoxggyY",
        authDomain: "tiendapasteleriamilsabor-a193d.firebaseapp.com",
        projectId: "tiendapasteleriamilsabor-a193d",
    };

    if (!firebase.apps?.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 1. Proteger la ruta: si no hay usuario, redirigir al login
    const usuarioStr = localStorage.getItem("usuario");
    if (!usuarioStr) {
        alert("Debes iniciar sesión para ver tu perfil.");
        window.location.href = "login.html";
        return;
    }

    const usuario = JSON.parse(usuarioStr);

    // 2. Rellenar la información del perfil en la página
    const nombreInput = document.getElementById('profile-nombre');
    const apellidoInput = document.getElementById('profile-apellido');
    const emailInput = document.getElementById('profile-email');
    const telefonoInput = document.getElementById('profile-telefono');
    const nombreHeader = document.getElementById('header-nombre');

    // Usar datos de Firestore si existen, si no, los del localStorage
    const userDoc = await db.collection("usuario").doc(usuario.uid).get();
    if (userDoc.exists) {
        const data = userDoc.data();
        if (nombreHeader) nombreHeader.textContent = data.nombre || usuario.nombre;
        if (nombreInput) nombreInput.value = data.nombre || '';
        if (apellidoInput) apellidoInput.value = data.apellido || ''; // Asumiendo que guardas apellido
        if (emailInput) emailInput.value = data.email || usuario.correo;
        if (telefonoInput) telefonoInput.value = data.telefono || '';
    } else {
        // Fallback con datos básicos del localStorage
        if (nombreHeader) nombreHeader.textContent = usuario.nombre;
        if (nombreInput) nombreInput.value = usuario.nombre;
        if (emailInput) emailInput.value = usuario.correo;
    }

    // 3. Configurar el botón de "Cerrar Sesión"
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            await auth.signOut();
            localStorage.removeItem("usuario");
            localStorage.removeItem("carrito"); // Limpiar también el carrito
            alert("Has cerrado sesión.");
            window.location.href = "../../index.html"; // Redirigir a la página de inicio
        });
    }

});
