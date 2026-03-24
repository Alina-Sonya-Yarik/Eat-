(() => {
    const section = document.querySelector('.how-it-works');

    if (!section) {
        return;
    }

    let frameId = 0;

    function getDescriptions() {
        return Array.from(section.querySelectorAll('.how-step-description'));
    }

    function updateDescriptionHeight() {
        frameId = 0;

        const descriptions = getDescriptions();

        if (!descriptions.length) {
            return;
        }

        descriptions.forEach(description => {
            description.style.minHeight = '0px';
        });

        const maxHeight = descriptions.reduce((height, description) => {
            return Math.max(height, Math.ceil(description.getBoundingClientRect().height));
        }, 0);

        descriptions.forEach(description => {
            description.style.removeProperty('min-height');
        });

        if (maxHeight > 0) {
            section.style.setProperty('--how-step-description-height', `${maxHeight}px`);
        }
    }

    function scheduleUpdate() {
        if (frameId) {
            return;
        }

        frameId = window.requestAnimationFrame(updateDescriptionHeight);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleUpdate, { once: true });
    } else {
        scheduleUpdate();
    }

    window.addEventListener('load', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);

    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(scheduleUpdate).catch(() => {});
    }

    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(scheduleUpdate);

        resizeObserver.observe(section);
        getDescriptions().forEach(description => resizeObserver.observe(description));
    }
})();
