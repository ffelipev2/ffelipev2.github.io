// Progressive enhancement: no Three.js request until HTML and priority images load.
const hero = document.querySelector('.hero-v2');
if (hero && 'IntersectionObserver' in window && 'ResizeObserver' in window) {
    const stage = hero.querySelector('[data-hero-stage]');
    const world = hero.querySelector('[data-hero-world]');
    const host = hero.querySelector('[data-hero-canvas]');
    const labels = [...hero.querySelectorAll('[data-station]')];
    const progressBar = hero.querySelector('[data-journey-progress]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 900px)');
    const connection = navigator.connection;
    const limited = () => connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
    let scene = null, generation = 0, frame = 0, idle = 0;
    let visible = true, suspended = false, loading = false, failed = false;
    let target = 0, progress = 0, previousTime = 0, slowFrames = 0, degraded = false;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0; };
    const release = () => {
        generation++; stop(); scene?.dispose(); scene = null; loading = false;
        hero.classList.remove('has-scene', 'has-travel');
        hero.style.removeProperty('--stage-height');
        progressBar.style.transform = 'scaleX(0)';
    };
    const fallback = () => { failed = true; release(); };
    const measure = () => {
        if (!scene) return;
        hero.style.setProperty('--stage-height', `${stage.offsetHeight}px`);
        scene.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
    };
    const readProgress = () => {
        if (motion.matches) return 0;
        if (mobile.matches) {
            const rect = world.getBoundingClientRect();
            return Math.max(0, Math.min(1, (innerHeight * .85 - rect.top) / (innerHeight * .55 + rect.height * .4)));
        }
        const stageHeight = stage.offsetHeight;
        const stickyTop = Math.min(72, innerHeight - stageHeight);
        const travel = hero.offsetHeight - stageHeight;
        return Math.max(0, Math.min(1, (stickyTop - hero.getBoundingClientRect().top) / Math.max(1, travel)));
    };
    const draw = (time) => {
        frame = 0;
        if (!scene || !visible || document.hidden || suspended) return;
        target = readProgress();
        const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
        previousTime = time;
        progress += (target - progress) * (1 - Math.exp(-elapsed / 75));
        if (Math.abs(target - progress) < .0005) progress = target;
        const start = performance.now();
        try { scene.render(progress, labels); } catch { fallback(); return; }
        const cost = performance.now() - start;
        if (cost > 32) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
        if (slowFrames >= 8) {
            if (degraded) { fallback(); return; }
            scene.reduceQuality(); degraded = true; slowFrames = 0;
        }
        progressBar.style.transform = `scaleX(${progress})`;
        if (progress !== target) frame = requestAnimationFrame(draw);
        else previousTime = 0;
    };
    const requestDraw = () => {
        if (scene && visible && !document.hidden && !suspended && !frame) frame = requestAnimationFrame(draw);
    };
    const init = async () => {
        if (scene || loading || failed || motion.matches || limited() || !visible || suspended || document.hidden) return;
        loading = true;
        const current = ++generation;
        try {
            const { createHeroScene } = await import('./hero/scene.bundle.js');
            if (current !== generation || suspended) return;
            scene = createHeroScene(host, { compact: mobile.matches, onContextLost: fallback });
            measure();
            // Render successfully before extending scroll or hiding the fallback.
            scene.render(0, labels);
            hero.classList.add('has-scene', 'has-travel');
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
    const preferenceChanged = () => { cancelIdle(); release(); failed = false; degraded = false; slowFrames = 0; schedule(); };
    const resized = () => { measure(); requestDraw(); };
    const visibilityChanged = () => { if (document.hidden) stop(); else { init(); requestDraw(); } };
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) { init(); requestDraw(); } else stop();
    }, { rootMargin: '100px' });
    const resizeObserver = new ResizeObserver(resized);
    const observe = () => { observer.observe(world); resizeObserver.observe(stage); };
    const loaded = () => { observe(); schedule(); };
    motion.addEventListener('change', preferenceChanged);
    mobile.addEventListener('change', preferenceChanged);
    connection?.addEventListener('change', preferenceChanged);
    window.addEventListener('scroll', requestDraw, { passive: true });
    window.addEventListener('resize', resized, { passive: true });
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', (event) => {
        suspended = true; cancelIdle(); release(); observer.disconnect(); resizeObserver.disconnect();
        if (!event.persisted) {
            motion.removeEventListener('change', preferenceChanged);
            mobile.removeEventListener('change', preferenceChanged);
            connection?.removeEventListener('change', preferenceChanged);
            window.removeEventListener('scroll', requestDraw);
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
