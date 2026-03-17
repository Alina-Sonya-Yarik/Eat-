/**
 * Layout Fix: keeps section bottom padding stable by always calculating
 * the final inline padding-bottom from the current layout state.
 */
const SECTION_SELECTOR = 'section';
const MEASURABLE_SELECTOR = '*';
const RESIZE_DEBOUNCE_MS = 120;
const EPSILON = 1;
const BASE_PADDING_CACHE = new Map();
const IGNORED_MEASUREMENT_SELECTORS = [
    '.container',
    '.grid-12',
    '.hero-grid',
    '.hero-content',
    '.what-eat-grid',
    '.what-eat-content',
    '.what-eat-text-group',
    '.cashback-grid',
    '.how-it-works-grid',
    '.popular-restaurants-grid',
    '.download-grid',
    '.download-content',
    '.cashback-ticket-bg',
];

let layoutFixFrame = null;
let layoutFixResizeTimer;

function getViewportBucket(viewportWidth) {
    if (viewportWidth <= 480) {
        return 'mobile';
    }

    if (viewportWidth <= 834) {
        return 'tablet-portrait';
    }

    if (viewportWidth <= 1194) {
        return 'tablet-landscape';
    }

    if (viewportWidth <= 1440) {
        return 'laptop';
    }

    return 'desktop';
}

function getTargetTopClearance(viewportWidth) {
    if (viewportWidth <= 480) {
        return 208;
    }

    if (viewportWidth <= 834) {
        return 240;
    }

    if (viewportWidth <= 1194) {
        return 240;
    }

    if (viewportWidth <= 1440) {
        return 272;
    }

    return 272;
}

function getTargetBottomClearance(viewportWidth) {
    if (viewportWidth <= 480) {
        return 64;
    }

    if (viewportWidth <= 834) {
        return 80;
    }

    if (viewportWidth <= 1194) {
        return 80;
    }

    if (viewportWidth <= 1440) {
        return 128;
    }

    return 128;
}

function shouldAdjustTopPadding(section) {
    return section.classList.contains('cashback');
}

function getBasePaddingCacheKey(section, viewportWidth) {
    return `${getViewportBucket(viewportWidth)}::${section.tagName}::${section.className}`;
}

function getSectionClassList(section) {
    return Array.from(section.classList).join(' ');
}

function measureBasePaddingBottom(section, viewportWidth) {
    return measureBasePadding(section, viewportWidth).bottom;
}

function measureBasePaddingTop(section, viewportWidth) {
    return measureBasePadding(section, viewportWidth).top;
}

function measureBasePadding(section, viewportWidth) {
    const cacheKey = getBasePaddingCacheKey(section, viewportWidth);

    if (BASE_PADDING_CACHE.has(cacheKey)) {
        return BASE_PADDING_CACHE.get(cacheKey);
    }

    const probe = document.createElement(section.tagName);
    const className = getSectionClassList(section);

    if (className) {
        probe.className = className;
    }

    probe.setAttribute('aria-hidden', 'true');
    probe.style.position = 'fixed';
    probe.style.left = '-99999px';
    probe.style.top = '0';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.inlineSize = '100vw';
    probe.style.blockSize = '0';
    probe.style.margin = '0';
    probe.style.border = '0';
    probe.style.minHeight = '0';
    probe.style.maxHeight = '0';
    probe.style.overflow = 'hidden';

    document.body.appendChild(probe);
    const computedStyle = window.getComputedStyle(probe);
    const basePadding = {
        top: parseFloat(computedStyle.paddingTop) || 0,
        bottom: parseFloat(computedStyle.paddingBottom) || 0,
    };
    document.body.removeChild(probe);

    BASE_PADDING_CACHE.set(cacheKey, basePadding);

    return basePadding;
}

function isIgnoredMeasurementTarget(element) {
    if (!(element instanceof HTMLElement)) {
        return true;
    }

    return IGNORED_MEASUREMENT_SELECTORS.some(selector => element.matches(selector));
}

function isVisibleMeasurementTarget(element) {
    if (!element || isIgnoredMeasurementTarget(element) || element.offsetWidth === 0 || element.offsetHeight === 0) {
        return false;
    }

    const computedStyle = window.getComputedStyle(element);

    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        return false;
    }

    return true;
}

function getSectionMeasurementTargets(section) {
    return Array.from(section.querySelectorAll(MEASURABLE_SELECTOR)).filter(isVisibleMeasurementTarget);
}

function getMaxMeasuredBottom(section, targets) {
    const sectionRect = section.getBoundingClientRect();
    let maxBottom = -Infinity;
    let minTop = Infinity;

    targets.forEach(target => {
        const targetRect = target.getBoundingClientRect();
        const relativeTop = targetRect.top - sectionRect.top;
        const relativeBottom = targetRect.bottom - sectionRect.top;

        if (relativeTop < minTop) {
            minTop = relativeTop;
        }

        if (relativeBottom > maxBottom) {
            maxBottom = relativeBottom;
        }
    });

    return { sectionRect, maxBottom, minTop };
}

function getInlinePadding(section, side) {
    const inlinePaddingValue = parseFloat(section.style[side]);

    if (Number.isNaN(inlinePaddingValue)) {
        return null;
    }

    return inlinePaddingValue;
}

function adjustSectionPadding(section, viewportWidth) {
    const targets = getSectionMeasurementTargets(section);

    if (targets.length === 0) {
        return;
    }

    const basePaddingBottom = measureBasePaddingBottom(section, viewportWidth);
    const basePaddingTop = measureBasePaddingTop(section, viewportWidth);
    const targetTopClearance = getTargetTopClearance(viewportWidth);
    const targetClearance = getTargetBottomClearance(viewportWidth);
    const { sectionRect, maxBottom, minTop } = getMaxMeasuredBottom(section, targets);
    const currentComputedPaddingTop = parseFloat(window.getComputedStyle(section).paddingTop) || 0;
    const currentComputedPaddingBottom = parseFloat(window.getComputedStyle(section).paddingBottom) || 0;

    if (maxBottom === -Infinity || minTop === Infinity) {
        return;
    }

    let projectedSectionHeight = sectionRect.height;

    if (shouldAdjustTopPadding(section)) {
        const topOverflow = Math.max(0, -minTop);
        const nextPaddingTop = Math.round(Math.max(basePaddingTop, targetTopClearance) + topOverflow);
        const currentInlinePaddingTop = getInlinePadding(section, 'paddingTop');
        const paddingTopDelta = nextPaddingTop - currentComputedPaddingTop;

        if (paddingTopDelta > 0) {
            projectedSectionHeight += paddingTopDelta;
        }

        if (currentInlinePaddingTop === null || Math.abs(currentInlinePaddingTop - nextPaddingTop) > EPSILON) {
            section.style.paddingTop = `${nextPaddingTop}px`;
        }
    }

    const visualContentBottom = projectedSectionHeight - currentComputedPaddingBottom;
    const imageOverflow = Math.max(0, maxBottom - visualContentBottom);
    const nextPaddingBottom = Math.round(Math.max(basePaddingBottom, targetClearance) + imageOverflow);
    const currentInlinePaddingBottom = getInlinePadding(section, 'paddingBottom');

    if (currentInlinePaddingBottom !== null && Math.abs(currentInlinePaddingBottom - nextPaddingBottom) <= EPSILON) {
        return;
    }

    section.style.paddingBottom = `${nextPaddingBottom}px`;
}

function adjustSectionPaddings() {
    const viewportWidth = window.innerWidth;
    const sections = document.querySelectorAll(SECTION_SELECTOR);

    sections.forEach(section => {
        adjustSectionPadding(section, viewportWidth);
    });
}

function scheduleAdjustSectionPaddings() {
    if (layoutFixFrame !== null) {
        return;
    }

    layoutFixFrame = requestAnimationFrame(() => {
        layoutFixFrame = null;
        adjustSectionPaddings();
    });
}

function onResize() {
    clearTimeout(layoutFixResizeTimer);
    layoutFixResizeTimer = setTimeout(() => {
        BASE_PADDING_CACHE.clear();
        scheduleAdjustSectionPaddings();
    }, RESIZE_DEBOUNCE_MS);
}

document.addEventListener('DOMContentLoaded', scheduleAdjustSectionPaddings);
window.addEventListener('load', scheduleAdjustSectionPaddings);
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => {
    BASE_PADDING_CACHE.clear();
    setTimeout(scheduleAdjustSectionPaddings, 150);
});

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        BASE_PADDING_CACHE.clear();
        scheduleAdjustSectionPaddings();
    });
}

window.addEventListener('load', () => {
    document.querySelectorAll('img').forEach(image => {
        if (image.complete) {
            return;
        }

        image.addEventListener('load', scheduleAdjustSectionPaddings, { once: true });
    });
});
