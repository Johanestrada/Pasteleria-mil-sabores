document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form-registro');
    const mensaje = document.getElementById('mensaje-descuento');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const edad = parseInt(document.getElementById('edad').value.trim(), 10);
        const codigo = document.getElementById('codigo').value.trim().toUpperCase();

        let mensajes = [];

        // Descuento por edad
        if (edad > 50) {
            mensajes.push('¡Felicidades! Recibes un <b>50% de descuento</b> en todos los productos por ser mayor de 50 años.');
        }

        // Descuento por código FELICES50
        if (codigo === 'FELICES50') {
            mensajes.push('¡Genial! Obtienes un <b>10% de descuento de por vida</b> por usar el código FELICES50.');
        }

        // Tortas gratis para estudiantes Duoc en su cumpleaños
        // Correo institucional Duoc: termina en @duocuc.cl
        const hoy = new Date();
        const cumple = hoy.getDate() + '-' + (hoy.getMonth() + 1); // Día y mes actual

        
        if (email.endsWith('@duocuc.cl')) {
            mensajes.push('¡Eres estudiante Duoc! <b>recibes una torta gratis!</b>.');
        }

        if (mensajes.length === 0) {
            mensaje.innerHTML = '<span class="text-danger">Registro exitoso, pero no aplicas a promociones especiales.</span>';
        } else {
            mensaje.innerHTML = mensajes.join('<br>');
        }

        // Aquí podrías enviar el formulario a un backend o limpiar el formulario si lo deseas
        // form.reset();
    });
});
