/**
 * Sticky Positioning Utility: Dynamically adjusts the 'top' property of .hero-left
 * to keep it at a specific distance from the BOTTOM of the viewport.
 */
let stickyResizeTimer;
let stickyFrame = null;
let lastAppliedStickyTop = null;

function fixStickyPosition() {
    const heroLeft = document.querySelector('.hero-left');
    if (!heroLeft) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // We only apply this for screens above 834px (desktop/laptop/horizontal tablet)
    if (width > 834) {
        let bottomOffset;

        if (width > 1440) {
            bottomOffset = 64; // Desktop
        } else if (width > 1194) {
            bottomOffset = 48; // Laptop
        } else {
            bottomOffset = 40; // Tablet
        }

        const elementHeight = heroLeft.offsetHeight;
        // top = viewport height - element height - offset from bottom
        const calculatedTop = Math.round(height - elementHeight - bottomOffset);

        if (lastAppliedStickyTop !== calculatedTop || heroLeft.style.top !== `${calculatedTop}px`) {
            heroLeft.style.top = `${calculatedTop}px`;
            lastAppliedStickyTop = calculatedTop;
        }
    } else {
        // Reset for mobile/vertical tablet
        if (heroLeft.style.top) {
            heroLeft.style.top = '';
        }
        lastAppliedStickyTop = null;
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

// Execute on load and resize
window.addEventListener('resize', onStickyResize);
window.addEventListener('load', scheduleStickyFix);
document.addEventListener('DOMContentLoaded', scheduleStickyFix);
// Also run periodically for a short while to catch image loads
setTimeout(scheduleStickyFix, 500);
setTimeout(scheduleStickyFix, 1000);
setTimeout(scheduleStickyFix, 2000);
