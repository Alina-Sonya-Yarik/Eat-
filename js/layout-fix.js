/**
 * Layout Fix: adds bottom padding only when section images visually eat into
 * the required bottom clearance for the current breakpoint.
 */
const SECTION_SELECTOR = 'section';
const IMAGE_SELECTOR = 'img';
const RESIZE_DEBOUNCE_MS = 120;
const EPSILON = 1;

let layoutFixFrame = null;
let layoutFixResizeTimer;

function getTargetBottomClearance(viewportWidth) {
    if (viewportWidth <= 480) {
        return 64;
    }

    if (viewportWidth <= 834) {
        return 80;
    }

    return 128;
}

function isVisibleImage(image) {
    if (!image || image.offsetWidth === 0 || image.offsetHeight === 0) {
        return false;
    }

    const computedStyle = window.getComputedStyle(image);

    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        return false;
    }

    return true;
}

function getSectionImages(section) {
    return Array.from(section.querySelectorAll(IMAGE_SELECTOR)).filter(isVisibleImage);
}

function getMaxImageBottom(section, images) {
    const sectionRect = section.getBoundingClientRect();
    let maxBottom = -Infinity;

    images.forEach(image => {
        const imageRect = image.getBoundingClientRect();
        const relativeBottom = imageRect.bottom - sectionRect.top;

        if (relativeBottom > maxBottom) {
            maxBottom = relativeBottom;
        }
    });

    return { sectionRect, maxBottom };
}

function adjustSectionPadding(section, viewportWidth) {
    const images = getSectionImages(section);

    if (images.length === 0) {
        section.style.paddingBottom = '';
        return;
    }

    section.style.paddingBottom = '';

    const computedStyle = window.getComputedStyle(section);
    const cssPaddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const targetClearance = getTargetBottomClearance(viewportWidth);
    const { sectionRect, maxBottom } = getMaxImageBottom(section, images);

    if (maxBottom === -Infinity) {
        section.style.paddingBottom = '';
        return;
    }

    const currentBottomGap = sectionRect.height - maxBottom;
    const requiredCorrection = Math.max(0, targetClearance - currentBottomGap);

    if (requiredCorrection <= EPSILON) {
        section.style.paddingBottom = '';
        return;
    }

    section.style.paddingBottom = `${Math.round(cssPaddingBottom + requiredCorrection)}px`;
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
    layoutFixResizeTimer = setTimeout(scheduleAdjustSectionPaddings, RESIZE_DEBOUNCE_MS);
}

document.addEventListener('DOMContentLoaded', scheduleAdjustSectionPaddings);
window.addEventListener('load', scheduleAdjustSectionPaddings);
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(scheduleAdjustSectionPaddings, 150));

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleAdjustSectionPaddings);
}

window.addEventListener('load', () => {
    document.querySelectorAll(IMAGE_SELECTOR).forEach(image => {
        if (image.complete) {
            return;
        }

        image.addEventListener('load', scheduleAdjustSectionPaddings, { once: true });
    });
});
