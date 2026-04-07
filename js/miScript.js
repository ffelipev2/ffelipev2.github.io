function getYouTubeEmbedData(videoURL) {
    try {
        const url = new URL(videoURL);
        const startTime = (url.searchParams.get('t') || url.searchParams.get('start') || '0').replace('s', '');

        if (url.hostname.includes('youtu.be')) {
            return {
                videoId: url.pathname.replace('/', ''),
                startTime: startTime
            };
        }

        return {
            videoId: url.searchParams.get('v') || '',
            startTime: startTime
        };
    } catch (error) {
        return {
            videoId: '',
            startTime: '0'
        };
    }
}

// Captura los clics en los enlaces y abre el modal solo si el video es válido.
document.querySelectorAll('.folio-card').forEach(function (element) {
    element.addEventListener('click', function (e) {
        const videoFrame = document.getElementById('videoFrame');

        if (!videoFrame) {
            return;
        }

        const videoData = getYouTubeEmbedData(this.getAttribute('href'));

        if (!videoData.videoId) {
            return;
        }

        e.preventDefault();

        videoFrame.src = `https://www.youtube.com/embed/${videoData.videoId}?start=${videoData.startTime}&autoplay=1`;
        $('#videoModal').modal('show');
    });
});

// Limpia el src del iframe cuando se cierra el modal.
$('#videoModal').on('hidden.bs.modal', function () {
    const videoFrame = document.getElementById('videoFrame');

    if (videoFrame) {
        videoFrame.src = '';
    }
});

// Revelado suave de secciones y tarjetas al entrar en pantalla
document.addEventListener('DOMContentLoaded', function () {
    const revealTargets = document.querySelectorAll(
        '.highlight-card, .folio-card, .section-skills .col-md-8, .section-experience .col-md-8, .section-certifications .col-md-3, .section-publications article, .section-education .col-md-8'
    );
    const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isSmallScreen || prefersReducedMotion || !('IntersectionObserver' in window)) {
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
        threshold: 0.12,
        rootMargin: '0px 0px -24px 0px'
    });

    revealTargets.forEach(function (element) {
        element.classList.add('reveal-item');
        observer.observe(element);
    });
});
