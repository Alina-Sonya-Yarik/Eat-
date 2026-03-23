(() => {
    const PRELOADER_DONE_EVENT = 'preloader:done';
    const READY_CLASS = 'reveal-ready';
    const VISIBLE_CLASS = 'reveal-visible';
    const FADE_UP_CLASS = 'reveal-fade-up';
    const FADE_CLASS = 'reveal-fade';
    const OBSERVER_THRESHOLD = 0.18;
    const OBSERVER_ROOT_MARGIN = '0px 0px -12% 0px';
    const STAGGER_MS = 120;
    const MAX_DELAY_MS = 420;
    const INITIAL_STAGGER_MS = 90;
    const INITIAL_MAX_DELAY_MS = 320;
    const INITIAL_REVEAL_SELECTORS = [
        '.header-container',
        '.hero-marquee-container',
        '.hero-left',
        '.hero-center',
        '.hero-right',
        '.footer-branding',
    ];
    const REVEAL_GROUPS = [
        { selector: '.header-container', variant: 'fade-up' },
        { selector: '.hero-marquee-container', variant: 'fade' },
        { selector: '.hero-left', variant: 'fade-up' },
        { selector: '.hero-center', variant: 'fade-up' },
        { selector: '.hero-right', variant: 'fade-up' },
        { selector: '.what-eat-content', variant: 'fade-up' },
        { selector: '.what-eat-images', variant: 'fade-up' },
        { selector: '.cashback-upper-text', variant: 'fade' },
        { selector: '.cashback-ticket-container', variant: 'fade' },
        { selector: '.cashback-mascot', variant: 'fade' },
        { selector: '.cashback-lower-text', variant: 'fade' },
        { selector: '.how-title', variant: 'fade-up' },
        { selector: '.how-step', variant: 'fade-up' },
        { selector: '.how-description', variant: 'fade-up' },
        { selector: '.popular-title', variant: 'fade-up' },
        { selector: '.popular-description', variant: 'fade-up' },
        { selector: '.popular-controls', variant: 'fade-up' },
        { selector: '.popular-slider-container', variant: 'fade-up' },
        { selector: '.download-header', variant: 'fade-up' },
        { selector: '.download-left-elements', variant: 'fade-up' },
        { selector: '.download-mascot-wrapper', variant: 'fade-up' },
        { selector: '.footer-row', variant: 'fade-up' },
        { selector: '.footer-branding', variant: 'fade' },
    ];
    const EXCLUDED_SELECTOR = [
        '.feedback-widget',
        '.feedback-widget *',
        '.popular-slider',
        '.popular-slider *',
    ].join(', ');
    let preparedTargets = [];
    let revealHasStarted = false;

    function isExcluded(element) {
        return element.matches(EXCLUDED_SELECTOR);
    }

    function getRevealClass(variant) {
        return variant === 'fade' ? FADE_CLASS : FADE_UP_CLASS;
    }

    function getRevealDuration(index) {
        return `${Math.min(980, 760 + index * 70)}ms`;
    }

    function getRevealDelay(index) {
        return `${Math.min(index * STAGGER_MS, MAX_DELAY_MS)}ms`;
    }

    function collectRevealTargets() {
        const targets = [];
        const seen = new Set();

        REVEAL_GROUPS.forEach(group => {
            const elements = document.querySelectorAll(group.selector);

            elements.forEach((element, index) => {
                if (!(element instanceof HTMLElement) || isExcluded(element) || seen.has(element)) {
                    return;
                }

                seen.add(element);
                targets.push({
                    element,
                    group,
                    index,
                });
            });
        });

        return targets;
    }

    function prepareRevealTarget({ element, group, index }) {
        element.classList.add(READY_CLASS, getRevealClass(group.variant));
        element.style.setProperty('--reveal-delay', getRevealDelay(index));
        element.style.setProperty('--reveal-duration', getRevealDuration(index));
    }

    function revealElement(element) {
        if (!(element instanceof HTMLElement) || element.classList.contains(VISIBLE_CLASS)) {
            return;
        }

        element.classList.add(VISIBLE_CLASS);
    }

    function initReducedMotion(targets) {
        targets.forEach(({ element }) => {
            revealElement(element);
        });
    }

    function initInitialReveal(targets, observer) {
        const initialSelectors = new Set(INITIAL_REVEAL_SELECTORS);
        const initialTargets = targets
            .filter(({ group }) => initialSelectors.has(group.selector))
            .sort(
                (left, right) =>
                    INITIAL_REVEAL_SELECTORS.indexOf(left.group.selector) -
                    INITIAL_REVEAL_SELECTORS.indexOf(right.group.selector)
            );

        initialTargets.forEach(({ element }, index) => {
            element.style.setProperty(
                '--reveal-delay',
                `${Math.min(index * INITIAL_STAGGER_MS, INITIAL_MAX_DELAY_MS)}ms`
            );
        });

        requestAnimationFrame(() => {
            initialTargets.forEach(({ element }) => {
                revealElement(element);

                if (observer) {
                    observer.unobserve(element);
                }
            });
        });
    }

    function initScrollReveal(targets) {
        if (typeof IntersectionObserver === 'undefined') {
            targets.forEach(({ element }) => revealElement(element));
            return null;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                }

                revealElement(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: OBSERVER_THRESHOLD,
            rootMargin: OBSERVER_ROOT_MARGIN,
        });

        targets.forEach(({ element }) => observer.observe(element));
        return observer;
    }

    function initPageReveal() {
        if (revealHasStarted) {
            return;
        }

        const targets = preparedTargets.length ? preparedTargets : collectRevealTargets();

        if (!targets.length) {
            return;
        }

        revealHasStarted = true;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            initReducedMotion(targets);
            return;
        }

        const observer = initScrollReveal(targets);
        initInitialReveal(targets, observer);
    }

    function preparePageReveal() {
        if (preparedTargets.length) {
            return preparedTargets;
        }

        preparedTargets = collectRevealTargets();

        if (!preparedTargets.length) {
            return preparedTargets;
        }

        preparedTargets.forEach(prepareRevealTarget);
        return preparedTargets;
    }

    function startWhenReady() {
        const preloader = document.querySelector('[data-page-preloader]');

        if (!preloader) {
            preparePageReveal();
            initPageReveal();
            return;
        }

        preparePageReveal();
        window.addEventListener(PRELOADER_DONE_EVENT, initPageReveal, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
    } else {
        startWhenReady();
    }
})();
