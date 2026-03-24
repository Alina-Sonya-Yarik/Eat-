(() => {
    const contentElements = Array.from(document.querySelectorAll('[data-ticket-content]'));

    if (!contentElements.length) {
        return;
    }

    function fitTicketCopy(content) {
        const copy = content.querySelector('[data-ticket-copy]');

        if (!(copy instanceof HTMLElement)) {
            return;
        }

        copy.style.transform = 'scale(1)';
        copy.style.top = '0px';

        const availableWidth = content.clientWidth;
        const availableHeight = content.clientHeight;
        const naturalWidth = copy.offsetWidth;
        const naturalHeight = copy.offsetHeight;

        if (!availableWidth || !availableHeight || !naturalWidth || !naturalHeight) {
            return;
        }

        const scale = Math.min(
            availableWidth / naturalWidth,
            availableHeight / naturalHeight,
            1
        );

        const centeredTop = Math.max(0, (availableHeight - naturalHeight * scale) / 2);

        copy.style.top = `${centeredTop}px`;
        copy.style.transform = `scale(${scale})`;
    }

    function fitAllTicketCopies() {
        contentElements.forEach(fitTicketCopy);
    }

    let resizeTimer = null;

    function scheduleFit() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            requestAnimationFrame(fitAllTicketCopies);
        }, 60);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleFit);
    } else {
        scheduleFit();
    }

    window.addEventListener('load', scheduleFit);
    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);
    window.addEventListener('pageshow', scheduleFit);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleFit).catch(() => {});
    }

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleFit);
        contentElements.forEach(content => observer.observe(content));
    }
})();
