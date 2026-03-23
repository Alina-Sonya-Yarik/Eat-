/**
 * Sticky Positioning Utility: Dynamically adjusts the 'top' property of .hero-left
 * to keep it at a specific distance from the BOTTOM of the viewport.
 */
let stickyResizeTimer;
let stickyFrame = null;
let lastAppliedStickyTop = null;
const STICKY_FIX_EVENT_NAME = 'stickyfix:updated';

function emitStickyFixUpdated() {
    window.dispatchEvent(new Event(STICKY_FIX_EVENT_NAME));
}

function getHeroVisualBottom() {
    const primaryImage = document.querySelector('.hero-heart-lunch');

    if (primaryImage && primaryImage.offsetWidth > 0 && primaryImage.offsetHeight > 0) {
        return primaryImage.getBoundingClientRect().bottom;
    }

    const fallbackElements = [
        document.querySelector('.hero-right'),
        document.querySelector('.hero-center'),
        document.querySelector('.hero-mockup'),
    ].filter(Boolean);

    let maxBottom = -Infinity;

    fallbackElements.forEach(element => {
        if (element.offsetWidth === 0 || element.offsetHeight === 0) return;
        const rect = element.getBoundingClientRect();
        if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    });

    return Number.isFinite(maxBottom) ? maxBottom : null;
}

function fixStickyPosition() {
    const heroLeft = document.querySelector('.hero-left');
    if (!heroLeft) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    let didUpdateStickyState = false;

    // We only apply this for screens above 834px (desktop/laptop/horizontal tablet)
    if (width > 834) {
        let bottomOffset;
        let canFollowImageBottom = false;

        if (width > 1440) {
            bottomOffset = 64; // Desktop
            canFollowImageBottom = true;
        } else if (width > 1194) {
            bottomOffset = 48; // Laptop
            canFollowImageBottom = true;
        } else {
            bottomOffset = 40; // Tablet landscape
        }

        const elementHeight = heroLeft.offsetHeight;
        // Baseline anchor: keep fixed gap from viewport bottom.
        const viewportAnchoredTop = Math.round(height - elementHeight - bottomOffset);
        let calculatedTop = viewportAnchoredTop;

        if (canFollowImageBottom) {
            const heroVisualBottom = getHeroVisualBottom();

            // Follow image bottom only when it is actually inside the viewport.
            // If image bottom is below the viewport, keep the stable offset and avoid "sticking".
            if (heroVisualBottom !== null && heroVisualBottom <= height) {
                const imageAnchoredTop = Math.round(heroVisualBottom - elementHeight);
                const maxVisibleTop = Math.round(height - elementHeight);
                calculatedTop = Math.min(Math.max(viewportAnchoredTop, imageAnchoredTop), maxVisibleTop);
            }
        }

        if (lastAppliedStickyTop !== calculatedTop || heroLeft.style.top !== `${calculatedTop}px`) {
            heroLeft.style.top = `${calculatedTop}px`;
            lastAppliedStickyTop = calculatedTop;
            didUpdateStickyState = true;
        }
    } else {
        // Reset for mobile/vertical tablet
        if (heroLeft.style.top) {
            heroLeft.style.top = '';
            didUpdateStickyState = true;
        }

        if (lastAppliedStickyTop !== null) {
            lastAppliedStickyTop = null;
            didUpdateStickyState = true;
        }
    }

    if (didUpdateStickyState) {
        emitStickyFixUpdated();
    }
}

function scheduleStickyFix() {
    if (stickyFrame !== null) return;

    stickyFrame = requestAnimationFrame(() => {
        stickyFrame = null;
        fixStickyPosition();
    });
}

function onStickyResize() {
    clearTimeout(stickyResizeTimer);
    stickyResizeTimer = setTimeout(scheduleStickyFix, 120);
}

window.heroStickyFix = {
    schedule: scheduleStickyFix,
    flush: fixStickyPosition,
};

// Execute on load and resize
window.addEventListener('resize', onStickyResize);
window.addEventListener('orientationchange', () => {
    clearTimeout(stickyResizeTimer);
    setTimeout(scheduleStickyFix, 150);
});
window.addEventListener('load', scheduleStickyFix);
document.addEventListener('DOMContentLoaded', scheduleStickyFix);
// Also run periodically for a short while to catch image loads
setTimeout(scheduleStickyFix, 500);
setTimeout(scheduleStickyFix, 1000);
setTimeout(scheduleStickyFix, 2000);
