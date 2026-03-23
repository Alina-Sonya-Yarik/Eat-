(() => {
    const PRELOADER_DONE_EVENT = 'preloader:done';
    const TOTAL_LOGOS = 1;
    const PROGRESS_MAX = 100;
    const STEP_INTERVAL_MS = 70;
    const MIN_VISIBLE_MS = 1100;
    const EXIT_DURATION_MS = 520;
    const FAILSAFE_COMPLETE_MS = 4200;
    const MAX_IDLE_PROGRESS = 92;
    const IDLE_STEP = 2.4;
    const COMPLETE_STEP = 7.5;

    const root = document.querySelector('[data-page-preloader]');
    const logosContainer = document.querySelector('[data-preloader-logos]');
    document.body.classList.add('page-is-loading');

    if (!root || !logosContainer) {
        document.body.classList.remove('page-is-loading');
        document.body.classList.add('page-is-ready');
        window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
        return;
    }

    const logoSrc = root.getAttribute('data-logo-src') || '../svg/logo.svg';
    const itemNodes = [];
    let progressValue = 10;
    let hasLoaded = false;
    let isDismissed = false;
    const startedAt = performance.now();

    function wait(ms) {
        return new Promise(resolve => {
            window.setTimeout(resolve, ms);
        });
    }

    function waitForAnimationFrame() {
        return new Promise(resolve => {
            requestAnimationFrame(() => resolve());
        });
    }

    function waitForFontsReady() {
        if (!document.fonts || !document.fonts.ready) {
            return Promise.resolve();
        }

        return document.fonts.ready.catch(() => undefined);
    }

    function waitForImage(image) {
        if (!(image instanceof HTMLImageElement) || image.complete) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const finish = () => resolve();
            image.addEventListener('load', finish, { once: true });
            image.addEventListener('error', finish, { once: true });
        });
    }

    function waitForHeroAssets() {
        const heroImages = Array.from(document.querySelectorAll('.hero-section img'));
        return Promise.all([
            waitForFontsReady(),
            ...heroImages.map(waitForImage),
        ]);
    }

    async function ensureHeroLayoutReady() {
        await waitForHeroAssets();

        if (window.sectionLayoutFix?.clearCache) {
            window.sectionLayoutFix.clearCache();
        }

        window.heroStickyFix?.flush?.();
        window.sectionLayoutFix?.flush?.();
        await waitForAnimationFrame();
        window.heroStickyFix?.flush?.();
        window.sectionLayoutFix?.flush?.();
        await waitForAnimationFrame();
    }

    function forceScrollTop() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }

    function buildLogoItems() {
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < TOTAL_LOGOS; index += 1) {
            const item = document.createElement('div');
            item.className = 'page-preloader__item';
            item.setAttribute('aria-hidden', 'true');
            item.style.setProperty('--preloader-logo-mask', `url("${logoSrc}")`);
            item.innerHTML = `
                <span class="page-preloader__logo-base"></span>
                <span class="page-preloader__logo-fill">
                    <span class="page-preloader__logo-liquid"></span>
                </span>
            `;
            itemNodes.push(item);
            fragment.appendChild(item);
        }

        logosContainer.appendChild(fragment);
    }

    function updateVisualState() {
        itemNodes.forEach((item, index) => {
            const fillValue = Math.max(0, Math.min(100, progressValue));
            item.style.setProperty('--logo-fill', fillValue.toFixed(2));
        });

        root.setAttribute('aria-valuenow', String(Math.round(progressValue)));
    }

    function finishPreloader() {
        if (isDismissed) {
            return;
        }

        isDismissed = true;
        forceScrollTop();
        root.classList.add('is-complete');

        window.setTimeout(() => {
            document.body.classList.remove('preloader-lock');
            document.body.classList.remove('page-is-loading');
            document.body.classList.add('page-is-ready');
            forceScrollTop();
            root.remove();
            window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
        }, EXIT_DURATION_MS);
    }

    function unlockCompletion() {
        if (hasLoaded) {
            return;
        }

        hasLoaded = true;
    }

    function tickProgress() {
        if (!hasLoaded && progressValue < MAX_IDLE_PROGRESS) {
            progressValue = Math.min(MAX_IDLE_PROGRESS, progressValue + IDLE_STEP);
            updateVisualState();
            return;
        }

        if (hasLoaded && progressValue < PROGRESS_MAX) {
            progressValue = Math.min(PROGRESS_MAX, progressValue + COMPLETE_STEP);
            updateVisualState();

            if (progressValue >= PROGRESS_MAX) {
                finishPreloader();
            }
        }
    }

    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    document.body.classList.add('preloader-lock');
    buildLogoItems();
    forceScrollTop();
    updateVisualState();

    const progressTimer = window.setInterval(tickProgress, STEP_INTERVAL_MS);

    window.setTimeout(() => {
        unlockCompletion();
    }, FAILSAFE_COMPLETE_MS);

    window.addEventListener('beforeunload', forceScrollTop);
    window.addEventListener('pageshow', forceScrollTop);

    window.addEventListener('load', async () => {
        const elapsed = performance.now() - startedAt;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

        try {
            await Promise.all([
                wait(remaining),
                ensureHeroLayoutReady(),
            ]);
        } finally {
            unlockCompletion();
        }
    }, { once: true });

    window.addEventListener(PRELOADER_DONE_EVENT, () => {
        window.clearInterval(progressTimer);
    }, { once: true });
})();
