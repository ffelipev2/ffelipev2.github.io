(() => {
    'use strict';

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;
    const motionPreferenceSubscribers = new Set();
    const subscribeToMotionPreference = (subscriber) => motionPreferenceSubscribers.add(subscriber);
    const updateMotionPreference = (event) => {
        prefersReducedMotion = event.matches;
        motionPreferenceSubscribers.forEach((subscriber) => subscriber(prefersReducedMotion));
    };

    if (typeof reducedMotionQuery.addEventListener === 'function') {
        reducedMotionQuery.addEventListener('change', updateMotionPreference);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
        reducedMotionQuery.addListener(updateMotionPreference);
    }
    const canEmbedYouTube = /^https?:$/.test(window.location.protocol) && window.location.origin !== 'null';
    const youtubeWatchUrl = (videoId) => 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
    const openVideoOnYouTube = (videoId) => window.open(youtubeWatchUrl(videoId), '_blank', 'noopener');
    const menuToggle = document.querySelector('.menu-toggle-v2');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuClosers = document.querySelectorAll('[data-menu-close], [data-menu-link]');
    let lastFocusedElement = null;
    let menuCloseTimer = null;
    let menuOpenFrame = null;

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
        // Safari does not focus a button on pointer activation; remember the invoker.
        lastFocusedElement = menuToggle;
        menuOverlay.hidden = false;
        mobileMenu.removeAttribute('inert');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Cerrar menú');
        document.body.classList.add('menu-open');
        setMenuBackgroundState(true);

        menuOpenFrame = window.requestAnimationFrame(() => {
            menuOpenFrame = null;
            menuOverlay.classList.add('is-visible');
            mobileMenu.classList.add('is-open');
            const firstFocusable = getFocusableElements(mobileMenu)[0];
            firstFocusable?.focus();
        });
    };

    const closeMenu = ({ restoreFocus = true } = {}) => {
        if (!menuToggle || !mobileMenu || !menuOverlay) return;

        window.cancelAnimationFrame(menuOpenFrame);
        menuOpenFrame = null;

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
        if (menuToggle?.getAttribute('aria-expanded') !== 'true') return;

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
            let videoIsVisible = false;
            slot.className = 'inline-video-slot';
            container.setAttribute('aria-busy', 'true');
            container.classList.add('is-video-loading');

            const revealInlineVideo = ({ focusFrame = false } = {}) => {
                if (videoIsVisible) return;
                videoIsVisible = true;
                container.removeAttribute('aria-busy');
                container.classList.remove('is-video-loading');
                slot.classList.add('is-ready');

                if (focusFrame) frame.focus({ preventScroll: true });
            };

            frame.addEventListener('load', () => {
                revealInlineVideo({ focusFrame: true });
            }, { once: true });
            slot.append(frame);
            container.replaceChildren(slot);
            button.setAttribute('aria-label', 'Demostración cargada: ' + title);
            window.setTimeout(revealInlineVideo, 5000);
        });
    });

    const copyToast = document.querySelector('.copy-toast');
    let toastTimer = null;
    let toastHideTimer = null;

    const hideCopyStatus = () => {
        if (!copyToast) return;
        copyToast.classList.remove('is-visible');
        window.clearTimeout(toastHideTimer);
        toastHideTimer = window.setTimeout(() => {
            if (!copyToast.classList.contains('is-visible')) copyToast.hidden = true;
        }, prefersReducedMotion ? 0 : 180);
    };

    const showCopyStatus = (message) => {
        if (!copyToast) return;
        window.clearTimeout(toastTimer);
        window.clearTimeout(toastHideTimer);
        copyToast.textContent = message;
        copyToast.hidden = false;
        copyToast.classList.remove('is-visible');
        window.requestAnimationFrame(() => copyToast.classList.add('is-visible'));
        toastTimer = window.setTimeout(() => {
            hideCopyStatus();
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

    const setupPageScroll = () => {
        const siteHeader = document.querySelector('[data-site-header]');
        const navigationLinks = Array.from(document.querySelectorAll(
            '.desktop-nav-v2 a[href^="#"], .mobile-nav > a[href^="#"]'
        ));
        const sectionIds = Array.from(new Set(navigationLinks.map((link) => link.hash.slice(1)).filter(Boolean)));
        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter((section) => section instanceof HTMLElement)
            .sort((first, second) => first.offsetTop - second.offsetTop);
        const projectMenu = document.querySelector('.mobile-nav details');
        const projectSummary = projectMenu?.querySelector(':scope > summary');
        let scrollFrame = null, progress = null, currentId = null, headerScrolled = null;
        let geometryDirty = true, maxScroll = 0, viewportHeight = 0;
        const sectionTops = new Float64Array(sections.length);

        const setCurrentSection = (id) => {
            if (id === currentId) return;
            currentId = id;
            navigationLinks.forEach((link) => {
                const isCurrent = link.hash === '#' + id;
                link.classList.toggle('is-current', isCurrent);
                if (isCurrent) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });

            const isProjectsCurrent = id === 'proyectos';
            projectMenu?.classList.toggle('is-current', isProjectsCurrent);
            if (isProjectsCurrent) projectSummary?.setAttribute('aria-current', 'location');
            else projectSummary?.removeAttribute('aria-current');
        };

        const updatePageScroll = () => {
            scrollFrame = null;
            // Read geometry together, only when layout has changed. Scroll
            // frames then use cached measurements before making any DOM writes.
            if (geometryDirty) {
                viewportHeight = window.innerHeight;
                maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 0);
                sections.forEach((section, index) => { sectionTops[index] = section.offsetTop; });
                geometryDirty = !('ResizeObserver' in window);
            }
            const top = window.scrollY;
            const isScrolled = top > 12;
            if (isScrolled !== headerScrolled) {
                siteHeader?.classList.toggle('is-scrolled', isScrolled);
                headerScrolled = isScrolled;
            }
            if (progress) progress.style.transform = 'scaleX(' + (maxScroll ? Math.max(0, Math.min(top / maxScroll, 1)) : 0) + ')';
            if (sections.length) {
                const readingLine = top + viewportHeight * .38;
                let current = 0;
                sectionTops.forEach((sectionTop, index) => { if (sectionTop <= readingLine) current = index; });
                setCurrentSection(sections[current].id);
            }
        };
        const requestScrollUpdate = () => {
            if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updatePageScroll);
        };
        const invalidateGeometry = () => { geometryDirty = true; requestScrollUpdate(); };
        const updateProgressPreference = (isReduced) => {
            if (isReduced) { progress?.remove(); progress = null; }
            else if (!progress && document.body.classList.contains('portfolio-page')) {
                progress = document.createElement('div');
                progress.className = 'reading-progress';
                progress.setAttribute('aria-hidden', 'true');
                document.body.prepend(progress);
            }
            invalidateGeometry();
        };
        updateProgressPreference(prefersReducedMotion);
        subscribeToMotionPreference(updateProgressPreference);
        // Hero enhancement, images and disclosures can move section boundaries
        // without resizing the window. Observe layout, not scroll transforms.
        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(invalidateGeometry);
            observer.observe(document.body);
            document.querySelectorAll('main > *, .hero-v2').forEach(element => observer.observe(element));
        }
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
        window.addEventListener('resize', invalidateGeometry, { passive: true });
        window.addEventListener('load', invalidateGeometry, { once: true });
        window.addEventListener('pageshow', invalidateGeometry);
    };

    const setupDisclosureMotion = () => {
        if (typeof Element.prototype.animate !== 'function') return;

        document.querySelectorAll('details.trajectory-details, details.content-disclosure, details.acknowledgement').forEach((disclosure) => {
            const summary = disclosure.querySelector(':scope > summary');
            let animation = null;

            summary?.addEventListener('click', (event) => {
                if (animation) {
                    event.preventDefault();
                    return;
                }
                if (prefersReducedMotion) return;

                event.preventDefault();
                const isOpening = !disclosure.open;
                const startHeight = disclosure.offsetHeight;
                let endHeight = startHeight;

                if (isOpening) {
                    disclosure.open = true;
                    endHeight = disclosure.offsetHeight;
                } else {
                    disclosure.classList.add('is-disclosure-closing');
                    disclosure.open = false;
                    endHeight = disclosure.offsetHeight;
                    disclosure.open = true;
                }

                disclosure.classList.add('is-disclosure-animating');
                disclosure.style.height = startHeight + 'px';

                animation = disclosure.animate({
                    height: [startHeight + 'px', endHeight + 'px']
                }, {
                    duration: 220,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
                });

                const completeAnimation = () => {
                    disclosure.open = isOpening;
                    disclosure.style.removeProperty('height');
                    disclosure.classList.remove('is-disclosure-animating', 'is-disclosure-closing');
                    animation = null;
                };

                animation.addEventListener('finish', completeAnimation, { once: true });
                animation.addEventListener('cancel', completeAnimation, { once: true });
            });
        });
    };

    const setupMotionLayer = () => {
        const root = document.documentElement;
        const scrollTargets = new Set();
        const pageEntryTargets = [];
        let motionObserver = null;

        const prepareTarget = (element, delay = 0, variant = '') => {
            if (!(element instanceof HTMLElement) || scrollTargets.has(element)) return;
            scrollTargets.add(element);
            element.classList.add('motion-reveal');
            if (variant) element.classList.add(variant);
            element.style.setProperty('--motion-delay', delay + 'ms');
        };

        const prepareGroup = (selector, stagger = 0, maximumSteps = 0) => {
            document.querySelectorAll(selector).forEach((element, index) => {
                const staggerIndex = maximumSteps ? Math.min(index, maximumSteps - 1) : index;
                prepareTarget(element, staggerIndex * stagger);
            });
        };

        document.querySelectorAll([
            '.inner-hero .shell > *',
            '.project-detail-hero .breadcrumb',
            '.project-detail-copy',
            '.project-detail-grid > .inline-video'
        ].join(', ')).forEach((element, index) => {
            const isMedia = element.matches('.project-detail-grid > .inline-video');
            prepareTarget(element, 70 + (index * 70), isMedia ? 'motion-reveal--media' : '');
            pageEntryTargets.push(element);
        });

        prepareGroup('.section-heading-v2, .profile-copy, .education-list, .certifications-block, .project-facts, .detail-content-grid > article, .project-features > .shell > h2, .project-technologies > .shell > h2, .technology-badges, .project-gallery > .shell > h2, .project-gallery figure, .contact-grid, .project-next a', 0);
        prepareGroup('.project-card-v2', 75, 3);
        prepareGroup('.profile-pillars > article', 75);
        prepareGroup('.timeline-preview > li', 85);
        prepareGroup('.technology-grid > article', 65);
        prepareGroup('.certification-grid > article', 65);
        prepareGroup('.publication-card', 75);
        prepareGroup('.feature-grid > article', 75);

        document.querySelectorAll('.timeline-preview').forEach((timeline) => {
            if (!(timeline instanceof HTMLElement) || scrollTargets.has(timeline)) return;
            scrollTargets.add(timeline);
            timeline.classList.add('motion-timeline');
        });

        if (!scrollTargets.size) return;

        const revealTarget = (element, immediately = false) => {
            if (immediately) {
                element.style.setProperty('--motion-delay', '0ms');
                element.classList.add('motion-reveal--immediate');
            }
            element.classList.add('motion-is-visible');
        };
        const revealAllTargets = () => scrollTargets.forEach((element) => revealTarget(element));
        let motionIsEnabled = false;

        const activateMotion = () => {
            if (motionIsEnabled || prefersReducedMotion) return;
            motionIsEnabled = true;
            root.classList.add('motion-ready');
            window.requestAnimationFrame(() => {
                if (!motionIsEnabled) return;
                root.classList.add('motion-has-started');
                pageEntryTargets.forEach((element) => revealTarget(element));

                if (!('IntersectionObserver' in window)) {
                    revealAllTargets();
                    return;
                }

                motionObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        revealTarget(entry.target);
                        motionObserver?.unobserve(entry.target);
                    });
                }, {
                    threshold: 0.08,
                    rootMargin: '0px 0px -8% 0px'
                });

                scrollTargets.forEach((element) => {
                    if (pageEntryTargets.includes(element) || element.getBoundingClientRect().top < window.innerHeight * 0.92) {
                        revealTarget(element);
                    } else {
                        motionObserver.observe(element);
                    }
                });
            });

        };

        const deactivateMotion = () => {
            motionIsEnabled = false;
            motionObserver?.disconnect();
            motionObserver = null;
            root.classList.remove('motion-ready', 'motion-has-started');
            revealAllTargets();
        };

        document.addEventListener('focusin', (event) => {
            if (!(event.target instanceof Element)) return;
            const focusedTarget = event.target.closest('.motion-reveal');
            if (!focusedTarget) return;
            revealTarget(focusedTarget, true);
            motionObserver?.unobserve(focusedTarget);
        });

        subscribeToMotionPreference((isReduced) => {
            if (isReduced) deactivateMotion();
        });

        if (prefersReducedMotion) {
            revealAllTargets();
        } else {
            activateMotion();
        }
    };

    setupPageScroll();
    setupDisclosureMotion();
    setupMotionLayer();
})();
