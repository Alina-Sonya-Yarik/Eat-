/**
 * Typography: короткие слова (1–3 буквы) не оставлять в конце строки.
 * Оборачиваем «короткое слово + следующее слово» в <span class="typo-nowrap"> —
 * браузер не разрывает блок, перенос идёт перед ним, «в» уезжает на следующую строку.
 */
(function () {
    const targetTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN', 'DIV'];
    const originalByElement = new WeakMap();
    const processedElements = [];
    const shortWord = '[a-zA-Zа-яА-ЯёЁ]{1,3}';
    const wrapClass = 'typo-nowrap';
    let lastTypographyBreakpoint = null;

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function applyTypographyToHtml(text) {
        if (!text || !text.trim()) return text;
        let t = escapeHtml(text);
        t = t.replace(/([a-zA-Zа-яА-ЯёЁ])([-](?=[a-zA-Zа-яА-ЯёЁ]))/g, '$1\u2011');
        const re = new RegExp('(\\s)(' + shortWord + ')(\\s)([^\\s]+)', 'g');
        t = t.replace(re, '$1<span class="' + wrapClass + '">$2$3$4</span>');
        return t;
    }

    function processElement(el) {
        const raw = el.textContent.trim();
        if (!raw) return;
        if (el.children.length > 0) return;
        if (!originalByElement.has(el)) {
            originalByElement.set(el, raw);
            processedElements.push(el);
        }
        const original = originalByElement.get(el);
        const processed = applyTypographyToHtml(original);
        el.innerHTML = processed;
    }

    function fixTypography() {
        const elements = document.querySelectorAll(targetTags.join(', '));
        elements.forEach(el => {
            if (el.closest('script') || el.closest('style')) return;
            try { processElement(el); } catch (e) { }
        });
    }

    function restoreAndRefix() {
        processedElements.forEach(el => {
            if (originalByElement.has(el)) el.textContent = originalByElement.get(el);
        });
        fixTypography();
    }

    function getTypographyBreakpoint(width) {
        if (width <= 480) return 'mobile';
        if (width <= 834) return 'tablet';
        if (width <= 1194) return 'small-desktop';
        if (width <= 1440) return 'desktop';
        return 'wide';
    }

    let resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const currentBreakpoint = getTypographyBreakpoint(window.innerWidth);
            if (currentBreakpoint === lastTypographyBreakpoint) return;

            lastTypographyBreakpoint = currentBreakpoint;
            restoreAndRefix();
        }, 120);
    }

    function run() {
        fixTypography();
    }

    function runWhenReady() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                lastTypographyBreakpoint = getTypographyBreakpoint(window.innerWidth);
                fixTypography();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runWhenReady);
        window.addEventListener('load', runWhenReady);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(runWhenReady, 50));
    } else {
        runWhenReady();
    }
    window.addEventListener('resize', onResize);
})();
