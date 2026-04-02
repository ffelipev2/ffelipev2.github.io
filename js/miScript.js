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

// Revelado suave de secciones y tarjetas al entrar en pantalla
document.addEventListener('DOMContentLoaded', function () {
    const revealTargets = document.querySelectorAll(
        '.section-intro, .section-portfolio, .section-skills, .section-experience, .section-education, .section-certifications, .section-publications, .footer, .folio-card, .section-experience .col-md-8, .section-certifications .col-md-3, .section-publications article, .section-education .col-md-8'
    );

    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach(function (element) {
            element.classList.add('is-visible');
        });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-item', 'is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.16,
        rootMargin: '0px 0px -40px 0px'
    });

    revealTargets.forEach(function (element) {
        element.classList.add('reveal-item');
        observer.observe(element);
    });
});
