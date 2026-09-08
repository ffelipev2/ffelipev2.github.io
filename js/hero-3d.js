// Progressive enhancement: no Three.js request until HTML and priority images load.
const hero = document.querySelector('.hero-v2');
if (hero && 'IntersectionObserver' in window && 'ResizeObserver' in window) {
    const stage = hero.querySelector('[data-hero-stage]');
    const world = hero.querySelector('[data-hero-world]');
    const host = hero.querySelector('[data-hero-canvas]');
    const labels = [...hero.querySelectorAll('[data-station]')];
    const progressBar = hero.querySelector('[data-journey-progress]');
    const portrait = hero.querySelector('.hero-portrait-v2');
    const journey = hero.querySelector('.hero-journey');
    const projects = document.querySelector('.projects-section');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 900px)');
    const phone = matchMedia('(max-width: 600px)');
    // svh stays fixed when mobile browser controls expand/collapse during a swipe.
    const viewport = document.createElement('div');
    viewport.className = 'hero-viewport-measure';
    viewport.setAttribute('aria-hidden', 'true');
    hero.append(viewport);
    const connection = navigator.connection;
    const limited = () => connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
    let scene = null, generation = 0, frame = 0, idle = 0;
    let visible = true, suspended = false, loading = false, failed = false;
    let progress = 0, slowFrames = 0, scrollStart = 0, scrollLength = 1;
    let densityQuery;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const release = () => {
        generation++; stop(); scene?.dispose(); scene = null; loading = false;
        hero.classList.remove('has-scene', 'has-travel');
        hero.style.removeProperty('--stage-height');
        progressBar.style.transform = 'scaleX(0)';
        portrait.style.removeProperty('opacity');
        journey.style.removeProperty('--journey-progress');
        projects?.style.removeProperty('--journey-complete');
    };
    const fallback = () => { failed = true; release(); };
    const measure = () => {
        if (!scene) return;
        const stageHeight = stage.offsetHeight;
        const stageSize = `${stageHeight}px`;
        if (hero.style.getPropertyValue('--stage-height') !== stageSize) hero.style.setProperty('--stage-height', stageSize);
        scene.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
        const viewportHeight = viewport.clientHeight || innerHeight;
        if (mobile.matches) {
            const rect = world.getBoundingClientRect();
            const worldTop = rect.top + scrollY;
            scrollStart = Math.max(0, worldTop - viewportHeight * .85);
            scrollLength = Math.max(1, worldTop - viewportHeight * .30 + rect.height * .4 - scrollStart);
        } else {
            scrollStart = hero.getBoundingClientRect().top + scrollY - Math.min(72, viewportHeight - stageHeight);
            scrollLength = Math.max(1, hero.offsetHeight - stageHeight);
        }
    };
    const readProgress = () => motion.matches ? 1 : Math.max(0, Math.min(1, (scrollY - scrollStart) / scrollLength));
    const draw = () => {
        frame = 0;
        if (!scene || !visible || document.hidden || suspended) return;
        // Follow native scrolling directly, with no extra inertia or catch-up.
        progress = readProgress();
        const start = performance.now();
        try { scene.render(progress, labels, motion.matches); } catch { fallback(); return; }
        const cost = performance.now() - start;
        let qualityChanged = false;
        if (cost > 32) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
        if (slowFrames >= 8) {
            qualityChanged = scene.reduceQuality();
            if (!qualityChanged) { fallback(); return; }
            slowFrames = 0;
        }
        progressBar.style.transform = `scaleX(${progress})`;
        portrait.style.opacity = motion.matches ? '1' : String(1 - progress * .10);
        journey.style.setProperty('--journey-progress', progress.toFixed(4));
        projects?.style.setProperty('--journey-complete', Math.max(0, Math.min(1, (progress - .90) / .06)).toFixed(4));
        // Resizing clears the drawing buffer, including on the last scroll frame.
        if (qualityChanged) frame = requestAnimationFrame(draw);
    };
    const requestDraw = () => {
        if (scene && visible && !document.hidden && !suspended && !frame) frame = requestAnimationFrame(draw);
    };
    const init = async () => {
        if (scene || loading || failed || limited() || !visible || suspended || document.hidden) return;
        loading = true;
        const current = ++generation;
        try {
            const { createHeroScene } = await import('./hero/scene.bundle.js');
            if (current !== generation || suspended) return;
            scene = createHeroScene(host, { compact: phone.matches, onContextLost: fallback });
            measure();
            // Render successfully before extending scroll or hiding the fallback.
            scene.render(motion.matches ? 1 : 0, labels, motion.matches);
            hero.classList.add('has-scene');
            hero.classList.toggle('has-travel', !motion.matches);
            measure();
            progress = readProgress(); requestDraw();
        } catch { if (current === generation) fallback(); }
        finally { if (current === generation) loading = false; }
    };
    const schedule = () => {
        if ('requestIdleCallback' in window) idle = requestIdleCallback(init, { timeout: 1800 });
        else idle = setTimeout(init, 100);
    };
    const cancelIdle = () => {
        if ('cancelIdleCallback' in window) cancelIdleCallback(idle);
        else clearTimeout(idle);
    };
    const preferenceChanged = () => { cancelIdle(); release(); failed = false; slowFrames = 0; schedule(); };
    const resized = () => { measure(); requestDraw(); };
    const watchDensity = () => {
        densityQuery?.removeEventListener('change', densityChanged);
        densityQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
        densityQuery.addEventListener('change', densityChanged);
    };
    const densityChanged = () => { watchDensity(); resized(); };
    const visibilityChanged = () => { if (document.hidden) stop(); else { init(); requestDraw(); } };
    const scrolled = () => { if (!motion.matches) requestDraw(); };
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) { init(); requestDraw(); } else stop();
    }, { rootMargin: '100px' });
    const resizeObserver = new ResizeObserver(resized);
    const observe = () => { observer.observe(world); resizeObserver.observe(stage); resizeObserver.observe(viewport); watchDensity(); };
    const loaded = () => { observe(); schedule(); };
    motion.addEventListener('change', preferenceChanged);
    mobile.addEventListener('change', preferenceChanged);
    phone.addEventListener('change', preferenceChanged);
    connection?.addEventListener('change', preferenceChanged);
    window.addEventListener('scroll', scrolled, { passive: true });
    window.addEventListener('resize', resized, { passive: true });
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', (event) => {
        suspended = true; cancelIdle(); release(); observer.disconnect(); resizeObserver.disconnect();
        densityQuery?.removeEventListener('change', densityChanged);
        if (!event.persisted) {
            motion.removeEventListener('change', preferenceChanged);
            mobile.removeEventListener('change', preferenceChanged);
            phone.removeEventListener('change', preferenceChanged);
            connection?.removeEventListener('change', preferenceChanged);
            window.removeEventListener('scroll', scrolled);
            window.removeEventListener('resize', resized);
            window.removeEventListener('load', loaded);
            document.removeEventListener('visibilitychange', visibilityChanged);
        }
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) { suspended = false; observe(); schedule(); }
    });
    if (document.readyState === 'complete') loaded();
    else window.addEventListener('load', loaded, { once: true });
}
