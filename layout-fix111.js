/**
 * Layout Fix: Dynamically adjusts section paddings to account for elements
 * that "bleed" into the padding area due to negative margins or positioning.
 * On resize: сначала сбрасываем inline padding, после reflow пересчитываем.
 */
function adjustSectionPaddings() {
    const sections = document.querySelectorAll('section.hero-section, section.cashback, section.what-eat');
    const TARGET_CLEARANCE = 128;

    sections.forEach(section => {
        section.style.paddingBottom = '';
    });

    // Пересчёт после того как браузер применит сброс и перестроит layout
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            sections.forEach(section => {
                const style = window.getComputedStyle(section);
                const basePaddingBottom = parseInt(style.paddingBottom, 10) || TARGET_CLEARANCE;
                const sectionRect = section.getBoundingClientRect();
                let maxBottomReach = -Infinity;

                const children = section.querySelectorAll('*');
                children.forEach(child => {
                    if (child.offsetWidth === 0 && child.offsetHeight === 0) return;
                    const cl = child.classList;
                    if (cl.contains('container') || cl.contains('cashback-grid') || cl.contains('what-eat-grid') ||
                        cl.contains('hero-grid') ||
                        cl.contains('cashback-ticket-bg') || cl.contains('cashback-ticket-container')) return;

                    const childRect = child.getBoundingClientRect();
                    const relBottom = childRect.bottom - sectionRect.top;
                    if (relBottom > maxBottomReach) maxBottomReach = relBottom;
                });

                const currentGapBottom = sectionRect.height - maxBottomReach;
                if (currentGapBottom < TARGET_CLEARANCE) {
                    const correction = TARGET_CLEARANCE - currentGapBottom;
                    section.style.paddingBottom = (basePaddingBottom + correction) + 'px';
                }
            });
        });
    });
}

let resizeTimer;
function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        requestAnimationFrame(adjustSectionPaddings);
    }, 80);
}

window.addEventListener('load', () => setTimeout(adjustSectionPaddings, 100));
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(adjustSectionPaddings, 150));
document.fonts.ready.then(() => setTimeout(adjustSectionPaddings, 50));
