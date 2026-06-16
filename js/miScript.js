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

function openYouTubeModalFromLink(element, event) {
    const videoFrame = document.getElementById('videoFrame');

    if (!videoFrame) {
        return;
    }

    const videoData = getYouTubeEmbedData(element.getAttribute('href'));

    if (!videoData.videoId) {
        return;
    }

    event.preventDefault();

    videoFrame.src = `https://www.youtube.com/embed/${videoData.videoId}?start=${videoData.startTime}&autoplay=1`;
    $('#videoModal').modal('show');
}

// Captura los clics en los enlaces y abre el modal solo si el video es válido.
document.querySelectorAll('.folio-card, .story-video-link').forEach(function (element) {
    element.addEventListener('click', function (e) {
        openYouTubeModalFromLink(this, e);
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
        '.story-opening, .story-step, .highlight-card, .folio-card, .section-skills .col-md-8, .section-experience .col-md-8, .section-certifications .col-md-3, .section-publications article, .section-education .col-md-8'
    );
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
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

// Sincroniza el panel visual del scrollytelling con la escena visible.
document.addEventListener('DOMContentLoaded', function () {
    const scroller = document.querySelector('[data-story-scroller]');

    if (!scroller) {
        return;
    }

    const steps = Array.from(scroller.querySelectorAll('[data-story-step]'));
    const image = document.getElementById('story-image');
    const label = document.getElementById('story-label');
    const signal = document.getElementById('story-signal');
    const caption = document.getElementById('story-caption');
    const videoLink = document.getElementById('story-video-link');
    const meter = document.getElementById('story-meter');
    const tags = document.getElementById('story-tags');
    const stage = scroller.querySelector('.story-stage');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeIndex = -1;

    function setActiveStep(index) {
        const step = steps[index];

        if (!step || index === activeIndex) {
            return;
        }

        activeIndex = index;

        steps.forEach(function (item, itemIndex) {
            item.classList.toggle('is-active', itemIndex === index);
        });

        if (label) {
            label.textContent = step.dataset.storyLabel || '';
        }

        if (signal) {
            signal.textContent = step.dataset.storySignal || '';
        }

        if (caption) {
            caption.textContent = step.dataset.storyCaption || '';
        }

        if (videoLink) {
            if (step.dataset.storyVideo) {
                videoLink.href = step.dataset.storyVideo;
                videoLink.hidden = false;
            } else {
                videoLink.hidden = true;
            }
        }

        if (meter) {
            meter.style.width = `${((index + 1) / steps.length) * 100}%`;
        }

        if (tags) {
            tags.innerHTML = '';
            tags.classList.remove('is-updating');
            (step.dataset.storyTags || '').split(',').forEach(function (tag) {
                const cleanTag = tag.trim();

                if (!cleanTag) {
                    return;
                }

                const tagElement = document.createElement('span');
                tagElement.textContent = cleanTag;
                tags.appendChild(tagElement);
            });

            if (!prefersReducedMotion) {
                window.requestAnimationFrame(function () {
                    tags.classList.add('is-updating');
                });
            }
        }

        if (image && step.dataset.storyImage && image.getAttribute('src') !== step.dataset.storyImage) {
            if (stage && !prefersReducedMotion) {
                stage.classList.add('is-switching');
            }

            image.src = step.dataset.storyImage;
            image.alt = step.dataset.storyAlt || '';

            image.addEventListener('load', function handleImageLoad() {
                if (stage) {
                    stage.classList.remove('is-switching');
                }

                image.removeEventListener('load', handleImageLoad);
            });

            image.addEventListener('error', function handleImageError() {
                if (stage) {
                    stage.classList.remove('is-switching');
                }

                image.removeEventListener('error', handleImageError);
            });

            if (image.complete && stage) {
                stage.classList.remove('is-switching');
            }
        }
    }

    setActiveStep(0);

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        return;
    }

    const storyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                setActiveStep(steps.indexOf(entry.target));
            }
        });
    }, {
        threshold: 0.35,
        rootMargin: '-18% 0px -48% 0px'
    });

    steps.forEach(function (step) {
        storyObserver.observe(step);
    });
});

// Progreso global y parallax sutil para reforzar la sensación de recorrido.
document.addEventListener('DOMContentLoaded', function () {
    const root = document.documentElement;
    const hero = document.querySelector('.hero-panel');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktopQuery = window.matchMedia('(min-width: 992px)');
    let scrollFrame = null;
    let heroFrame = null;

    function updateScrollProgress() {
        const scrollTop = window.pageYOffset || root.scrollTop || 0;
        const maxScroll = Math.max(root.scrollHeight - window.innerHeight, 1);
        root.style.setProperty('--scroll-progress', Math.min(scrollTop / maxScroll, 1).toFixed(4));
        scrollFrame = null;
    }

    function requestScrollProgress() {
        if (scrollFrame) {
            return;
        }

        scrollFrame = window.requestAnimationFrame(updateScrollProgress);
    }

    updateScrollProgress();
    window.addEventListener('scroll', requestScrollProgress, { passive: true });
    window.addEventListener('resize', requestScrollProgress);

    if (!hero || prefersReducedMotion) {
        return;
    }

    function setHeroShift(x, y) {
        hero.style.setProperty('--hero-shift-x', x.toFixed(2));
        hero.style.setProperty('--hero-shift-y', y.toFixed(2));
        heroFrame = null;
    }

    hero.addEventListener('pointermove', function (event) {
        if (!desktopQuery.matches || heroFrame) {
            return;
        }

        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * -18;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -10;

        heroFrame = window.requestAnimationFrame(function () {
            setHeroShift(x, y);
        });
    });

    hero.addEventListener('pointerleave', function () {
        hero.style.setProperty('--hero-shift-x', '0');
        hero.style.setProperty('--hero-shift-y', '0');
    });
});
