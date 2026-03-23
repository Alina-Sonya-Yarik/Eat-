(() => {
    const SECTION_SELECTOR = '.what-eat';
    const CONTENT_SELECTOR = '.what-eat-content';
    const TAGLINE_SELECTOR = '.what-eat-tagline';
    const IMAGES_SELECTOR = '.what-eat-images';
    const RESIZE_DEBOUNCE_MS = 120;
    const DESKTOP_MIN_WIDTH = 835;

    let alignFrame = null;
    let resizeTimer = null;

    function alignWhatEatTagline() {
        const section = document.querySelector(SECTION_SELECTOR);
        if (!section) {
            return;
        }

        const content = section.querySelector(CONTENT_SELECTOR);
        const tagline = section.querySelector(TAGLINE_SELECTOR);
        const images = section.querySelector(IMAGES_SELECTOR);

        if (!content || !tagline || !images) {
            return;
        }

        // Tablet portrait/mobile use a different flow (display: contents), so reset.
        if (window.innerWidth < DESKTOP_MIN_WIDTH) {
            tagline.style.marginTop = '';
            return;
        }

        // Reset before measurement to avoid cumulative offsets.
        tagline.style.marginTop = '0px';

        const taglineRect = tagline.getBoundingClientRect();
        const imagesRect = images.getBoundingClientRect();
        const delta = Math.round(imagesRect.bottom - taglineRect.bottom);

        tagline.style.marginTop = delta > 0 ? `${delta}px` : '0px';
    }

    function scheduleAlign() {
        if (alignFrame !== null) {
            return;
        }

        alignFrame = requestAnimationFrame(() => {
            alignFrame = null;
            alignWhatEatTagline();
        });
    }

    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scheduleAlign, RESIZE_DEBOUNCE_MS);
    }

    document.addEventListener('DOMContentLoaded', scheduleAlign);
    window.addEventListener('load', scheduleAlign);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => {
        clearTimeout(resizeTimer);
        setTimeout(scheduleAlign, 150);
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleAlign);
    }

    window.addEventListener('load', () => {
        document.querySelectorAll(`${SECTION_SELECTOR} img`).forEach(image => {
            if (image.complete) {
                return;
            }

            image.addEventListener('load', scheduleAlign, { once: true });
        });
    });
})();
