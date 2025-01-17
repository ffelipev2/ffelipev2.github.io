// Captura los clics en los enlaces y abre el modal
document.querySelectorAll('.folio-card').forEach(function (element) {
    element.addEventListener('click', function (e) {
        e.preventDefault(); // Evita la redirección

        // Obtener el enlace del video
        const videoURL = this.getAttribute('href');
        let videoID = videoURL.split('v=')[1].split('&')[0]; // Extrae el ID del video
        let startTime = videoURL.includes('t=') ? videoURL.split('t=')[1].replace('s', '') : 0; // Extrae el tiempo de inicio

        // Construir la URL de embed
        const embedURL = `https://www.youtube.com/embed/${videoID}?start=${startTime}&autoplay=1`;

        // Actualizar el iframe del modal con el video
        document.getElementById('videoFrame').src = embedURL;

        // Mostrar el modal
        $('#videoModal').modal('show');
    });
});

// Limpia el src del iframe cuando se cierra el modal
$('#videoModal').on('hidden.bs.modal', function () {
    document.getElementById('videoFrame').src = '';
});