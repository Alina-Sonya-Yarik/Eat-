/**
 * Layout Fix: keeps enough bottom clearance for overlapping artwork
 * without resetting section padding during resize.
 */
const LAYOUT_FIX_SELECTOR = 'section.hero-section, section.cashback, section.what-eat';
const SECTION_GAP_EPSILON = 1;
let scheduledAdjustFrame = null;
let resizeTimer;

function getBasePaddingBottom(section, viewportWidth) {
    if (section.classList.contains('hero-section')) {
        return getTargetClearance(viewportWidth);
    }

    if (section.classList.contains('what-eat')) {
        return getTargetClearance(viewportWidth);
    }

    if (section.classList.contains('cashback')) {
        return getTargetClearance(viewportWidth);
    }

    return getTargetClearance(viewportWidth);
}

function getTargetClearance(viewportWidth) {
    if (viewportWidth <= 480) {
        return 64;
    }

    if (viewportWidth <= 834) {
        return 80;
    }

    return 128;
}

function shouldUseDynamicPadding(section, viewportWidth) {
    if (section.classList.contains('hero-section')) {
        return true;
    }

    if (section.classList.contains('what-eat')) {
        return false;
    }

    if (section.classList.contains('cashback')) {
        return false;
    }

    if (viewportWidth <= 834) {
        return false;
    }

    return true;
}

function getChildrenToMeasure(section) {
    if (section.classList.contains('hero-section')) {
        return section.querySelectorAll('.hero-center .hero-mockup, .hero-right .hero-heart-lunch');
    }

    if (section.classList.contains('cashback')) {
        return section.querySelectorAll('.cashback-mascot');
    }

    if (section.classList.contains('what-eat')) {
        return section.querySelectorAll('.what-eat-images img');
    }

    return [];
}

function shouldMeasureChild(child) {
    if (child.offsetWidth === 0 && child.offsetHeight === 0) {
        return false;
    }

    const computedStyle = window.getComputedStyle(child);

    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        return false;
    }

    return true;
}

function getMeasuredBottomReach(section) {
    const sectionRect = section.getBoundingClientRect();
    let maxBottomReach = -Infinity;

    getChildrenToMeasure(section).forEach(child => {
        if (!shouldMeasureChild(child)) {
            return;
        }

        const childRect = child.getBoundingClientRect();
        const relBottom = childRect.bottom - sectionRect.top;

        if (relBottom > maxBottomReach) {
            maxBottomReach = relBottom;
        }
    });

    return { sectionRect, maxBottomReach };
}

function adjustSectionPaddings() {
    const sections = document.querySelectorAll(LAYOUT_FIX_SELECTOR);
    const viewportWidth = window.innerWidth;
    const targetClearance = getTargetClearance(viewportWidth);

    sections.forEach(section => {
        const basePaddingBottom = getBasePaddingBottom(section, viewportWidth);
        const previousInlinePaddingBottom = section.style.paddingBottom;

        section.style.paddingBottom = '';

        const cssPaddingBottom = parseFloat(window.getComputedStyle(section).paddingBottom) || 0;
        if (Math.abs(cssPaddingBottom - basePaddingBottom) > SECTION_GAP_EPSILON) {
            section.style.paddingBottom = `${basePaddingBottom}px`;
        }

        if (!shouldUseDynamicPadding(section, viewportWidth)) {
            if (Math.abs(cssPaddingBottom - basePaddingBottom) <= SECTION_GAP_EPSILON) {
                section.style.paddingBottom = '';
                return;
            }

            if (previousInlinePaddingBottom === `${basePaddingBottom}px`) {
                return;
            }

            section.style.paddingBottom = `${basePaddingBottom}px`;
            return;
        }

        const { sectionRect, maxBottomReach } = getMeasuredBottomReach(section);

        if (maxBottomReach === -Infinity) {
            section.style.paddingBottom = '';
            return;
        }

        const naturalGapBottom = sectionRect.height - maxBottomReach;
        const requiredExtraPaddingBottom = Math.max(0, targetClearance - naturalGapBottom);
        const nextPaddingBottom = Math.round(basePaddingBottom + requiredExtraPaddingBottom);

        if (requiredExtraPaddingBottom <= SECTION_GAP_EPSILON) {
            if (Math.abs(cssPaddingBottom - basePaddingBottom) <= SECTION_GAP_EPSILON) {
                section.style.paddingBottom = '';
                return;
            }

            if (previousInlinePaddingBottom === `${basePaddingBottom}px`) {
                return;
            }

            section.style.paddingBottom = `${basePaddingBottom}px`;
            return;
        }

        if (previousInlinePaddingBottom === `${nextPaddingBottom}px`) {
            return;
        }

        section.style.paddingBottom = `${nextPaddingBottom}px`;
    });
}

function scheduleAdjustSectionPaddings() {
    if (scheduledAdjustFrame !== null) return;

    scheduledAdjustFrame = requestAnimationFrame(() => {
        scheduledAdjustFrame = null;
        adjustSectionPaddings();
    });
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scheduleAdjustSectionPaddings, 120);
}

window.addEventListener('load', () => setTimeout(scheduleAdjustSectionPaddings, 100));
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(scheduleAdjustSectionPaddings, 150));

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(scheduleAdjustSectionPaddings, 50));
}

window.addEventListener('load', () => {
    document.querySelectorAll('img').forEach(img => {
        if (img.complete) {
            return;
        }

        img.addEventListener('load', scheduleAdjustSectionPaddings, { once: true });
    });
});
