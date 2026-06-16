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
    const portfolioCards = Array.from(document.querySelectorAll('.section-portfolio .folio-card'));
    const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollProgress = document.querySelector('.scroll-progress');
    const skillSection = document.querySelector('.section-skills');
    const skillBars = Array.from(document.querySelectorAll('.section-skills .progress-bar'));

    function updatePageProgress() {
        if (!scrollProgress) {
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;

        scrollProgress.style.width = `${progress * 100}%`;
    }

    function revealSkillBars() {
        skillBars.forEach(function (bar, index) {
            const targetWidth = bar.dataset.targetWidth || bar.style.width || `${bar.getAttribute('aria-valuenow') || 0}%`;

            window.setTimeout(function () {
                bar.style.width = targetWidth;
            }, index * 70);
        });
    }

    skillBars.forEach(function (bar) {
        const targetWidth = bar.style.width || `${bar.getAttribute('aria-valuenow') || 0}%`;
        bar.dataset.targetWidth = targetWidth;

        if (!prefersReducedMotion) {
            bar.style.width = '0%';
        }
    });

    if (!prefersReducedMotion) {
        const staggerColumns = window.matchMedia('(min-width: 992px)').matches ? 3 : 2;

        portfolioCards.forEach(function (card, index) {
            const staggerIndex = index % staggerColumns;
            card.style.transitionDelay = `${staggerIndex * 90}ms`;
        });
    }

    updatePageProgress();
    window.addEventListener('scroll', updatePageProgress, { passive: true });
    window.addEventListener('resize', updatePageProgress);

    if (isSmallScreen || prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealTargets.forEach(function (element) {
            element.classList.add('is-visible');
        });

        skillBars.forEach(function (bar) {
            bar.style.width = bar.dataset.targetWidth || bar.style.width;
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

    if (skillSection && skillBars.length) {
        const skillObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    revealSkillBars();
                    skillObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.25
        });

        skillObserver.observe(skillSection);
    }
});
