(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canEmbedYouTube = /^https?:$/.test(window.location.protocol) && window.location.origin !== 'null';
    const youtubeWatchUrl = (videoId) => 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
    const openVideoOnYouTube = (videoId) => window.open(youtubeWatchUrl(videoId), '_blank', 'noopener');
    const menuToggle = document.querySelector('.menu-toggle-v2');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuClosers = document.querySelectorAll('[data-menu-close], [data-menu-link]');
    let lastFocusedElement = null;
    let menuCloseTimer = null;

    const menuBackgroundElements = () => Array.from(document.body.children).filter(
        (element) => element !== mobileMenu && element !== menuOverlay && element.tagName !== 'SCRIPT'
    );

    const setMenuBackgroundState = (isInactive) => {
        menuBackgroundElements().forEach((element) => {
            if (isInactive) {
                const previousAriaHidden = element.getAttribute('aria-hidden');
                element.dataset.menuPreviousAriaHidden = previousAriaHidden === null ? '__none__' : previousAriaHidden;
                element.setAttribute('inert', '');
                element.setAttribute('aria-hidden', 'true');
                return;
            }

            element.removeAttribute('inert');
            const previousAriaHidden = element.dataset.menuPreviousAriaHidden;
            if (previousAriaHidden === undefined) return;

            if (previousAriaHidden === '__none__') element.removeAttribute('aria-hidden');
            else element.setAttribute('aria-hidden', previousAriaHidden);
            delete element.dataset.menuPreviousAriaHidden;
        });
    };

    const getFocusableElements = (container) => Array.from(
        container.querySelectorAll(
            'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');

    const openMenu = () => {
        if (!menuToggle || !mobileMenu || !menuOverlay) return;

        window.clearTimeout(menuCloseTimer);
        lastFocusedElement = document.activeElement;
        menuOverlay.hidden = false;
        mobileMenu.removeAttribute('inert');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Cerrar menú');
        document.body.classList.add('menu-open');
        setMenuBackgroundState(true);

        window.requestAnimationFrame(() => {
            menuOverlay.classList.add('is-visible');
            mobileMenu.classList.add('is-open');
            const firstFocusable = getFocusableElements(mobileMenu)[0];
            firstFocusable?.focus();
        });
    };

    const closeMenu = ({ restoreFocus = true } = {}) => {
        if (!menuToggle || !mobileMenu || !menuOverlay) return;

        mobileMenu.classList.remove('is-open');
        menuOverlay.classList.remove('is-visible');
        mobileMenu.setAttribute('inert', '');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú');
        document.body.classList.remove('menu-open');
        setMenuBackgroundState(false);

        menuCloseTimer = window.setTimeout(() => {
            menuOverlay.hidden = true;
        }, prefersReducedMotion ? 0 : 220);

        if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus();
        }
    };

    menuToggle?.addEventListener('click', () => {
        const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeMenu();
        else openMenu();
    });

    menuClosers.forEach((element) => {
        element.addEventListener('click', () => {
            if (mobileMenu?.classList.contains('is-open')) {
                closeMenu();
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!mobileMenu?.classList.contains('is-open')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu();
            return;
        }

        if (event.key !== 'Tab') return;

        const focusable = getFocusableElements(mobileMenu);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && mobileMenu?.classList.contains('is-open')) {
            closeMenu({ restoreFocus: false });
        }
    });

    const siteHeader = document.querySelector('[data-site-header]');
    const updateHeader = () => {
        siteHeader?.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const videoDialog = document.querySelector('#video-dialog');
    const dialogVideo = videoDialog?.querySelector('[data-dialog-video]');
    const dialogTitle = videoDialog?.querySelector('#video-dialog-title');
    const dialogYouTube = videoDialog?.querySelector('[data-dialog-youtube]');
    const dialogClose = videoDialog?.querySelector('[data-dialog-close]');

    const createVideoFrame = (videoId, title) => {
        const iframe = document.createElement('iframe');
        const pageOrigin = /^https?:$/.test(window.location.protocol) && window.location.origin !== 'null'
            ? window.location.origin
            : 'https://felipeflores.tech';
        const playerUrl = new URL('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId));
        playerUrl.searchParams.set('rel', '0');
        playerUrl.searchParams.set('origin', pageOrigin);
        playerUrl.searchParams.set('widget_referrer', pageOrigin);
        iframe.title = 'Demostración: ' + title;
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        iframe.src = playerUrl.toString();
        return iframe;
    };

    const clearDialogVideo = () => {
        dialogVideo?.replaceChildren();
    };

    document.querySelectorAll('[data-video-id]').forEach((button) => {
        button.addEventListener('click', () => {
            if (!videoDialog || !dialogVideo) return;

            const videoId = button.dataset.videoId || '';
            const title = button.dataset.videoTitle || 'Proyecto';
            if (!videoId) return;
            if (!canEmbedYouTube) {
                openVideoOnYouTube(videoId);
                return;
            }

            clearDialogVideo();
            dialogVideo.append(createVideoFrame(videoId, title));
            if (dialogTitle) dialogTitle.textContent = title;
            if (dialogYouTube) dialogYouTube.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);

            if (typeof videoDialog.showModal === 'function') {
                videoDialog.showModal();
            } else {
                videoDialog.setAttribute('open', '');
            }
        });
    });

    const closeVideoDialog = () => {
        if (!videoDialog) return;
        if (typeof videoDialog.close === 'function') videoDialog.close();
        else {
            videoDialog.removeAttribute('open');
            clearDialogVideo();
        }
    };

    dialogClose?.addEventListener('click', closeVideoDialog);
    videoDialog?.addEventListener('click', (event) => {
        if (event.target === videoDialog) closeVideoDialog();
    });
    videoDialog?.addEventListener('close', clearDialogVideo);

    document.querySelectorAll('[data-inline-video]').forEach((button) => {
        button.addEventListener('click', () => {
            const container = button.closest('.inline-video') || button.closest('.project-detail-grid')?.querySelector('.inline-video');
            const videoId = button.dataset.inlineVideo || '';
            const title = button.dataset.videoTitle || 'Proyecto';
            if (!container || !videoId) return;
            if (!canEmbedYouTube) {
                openVideoOnYouTube(videoId);
                return;
            }

            const existingFrame = container.querySelector('iframe');
            if (existingFrame) {
                existingFrame.focus({ preventScroll: true });
                return;
            }

            const slot = document.createElement('div');
            const frame = createVideoFrame(videoId, title);
            slot.className = 'inline-video-slot';
            container.setAttribute('aria-busy', 'true');
            frame.addEventListener('load', () => {
                container.removeAttribute('aria-busy');
                frame.focus({ preventScroll: true });
            }, { once: true });
            slot.append(frame);
            container.replaceChildren(slot);
            button.setAttribute('aria-label', 'Demostración cargada: ' + title);
        });
    });

    const copyToast = document.querySelector('.copy-toast');
    let toastTimer = null;

    const showCopyStatus = (message) => {
        if (!copyToast) return;
        window.clearTimeout(toastTimer);
        copyToast.textContent = message;
        copyToast.hidden = false;
        toastTimer = window.setTimeout(() => {
            copyToast.hidden = true;
        }, 2400);
    };

    const copyText = async (text, restoreFocusTarget) => {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        let successful = false;
        try {
            textarea.select();
            successful = document.execCommand('copy');
        } finally {
            textarea.remove();
            if (restoreFocusTarget instanceof HTMLElement && document.contains(restoreFocusTarget)) {
                restoreFocusTarget.focus({ preventScroll: true });
            }
        }
        if (!successful) throw new Error('Copy failed');
    };

    document.querySelectorAll('[data-copy-citation]').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await copyText(button.dataset.copyCitation || '', button);
                showCopyStatus('Referencia copiada.');
            } catch {
                showCopyStatus('No fue posible copiar la referencia.');
            }
        });
    });

    document.querySelectorAll('[data-carousel]').forEach((carousel) => {
        const track = carousel.querySelector('[data-carousel-track]');
        const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
        const previous = carousel.querySelector('[data-carousel-prev]');
        const next = carousel.querySelector('[data-carousel-next]');
        const dots = Array.from(carousel.querySelectorAll('.carousel-dots span'));
        let activeIndex = 0;
        let scrollFrame = null;

        if (!track || !slides.length) return;

        const updateDots = (index) => {
            activeIndex = Math.max(0, Math.min(index, slides.length - 1));
            dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === activeIndex));
        };

        const goToSlide = (index) => {
            const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
            const target = slides[nextIndex];
            track.scrollTo({
                left: target.offsetLeft - track.offsetLeft,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
            updateDots(nextIndex);
        };

        previous?.addEventListener('click', () => goToSlide(activeIndex - 1));
        next?.addEventListener('click', () => goToSlide(activeIndex + 1));

        track.addEventListener('scroll', () => {
            if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
            scrollFrame = window.requestAnimationFrame(() => {
                const left = track.scrollLeft;
                const closestIndex = slides.reduce((bestIndex, slide, index) => {
                    const bestDistance = Math.abs(slides[bestIndex].offsetLeft - track.offsetLeft - left);
                    const currentDistance = Math.abs(slide.offsetLeft - track.offsetLeft - left);
                    return currentDistance < bestDistance ? index : bestIndex;
                }, 0);
                updateDots(closestIndex);
            });
        }, { passive: true });
    });
})();
