(() => {
    const SECTION_SELECTOR = '.popular-restaurants';
    const TRACK_SELECTOR = '.popular-slider';
    const CONTAINER_SELECTOR = '.popular-slider-container';
    const CARD_SELECTOR = '.popular-restaurant-card';
    const CLONE_CLASS = 'popular-restaurant-card-clone';
    const PREV_BUTTON_SELECTOR = '.popular-back-button';
    const NEXT_BUTTON_SELECTOR = '.popular-next-button';
    const PROGRESS_SELECTOR = '.popular-progress';
    const PROGRESS_FILL_SELECTOR = '.popular-progress-fill';
    const TRANSITION_VALUE = 'transform 420ms ease';
    const RESIZE_DEBOUNCE_MS = 120;

    function getGap(track) {
        const style = window.getComputedStyle(track);
        const gap = style.columnGap || style.gap || '0';
        return Number.parseFloat(gap) || 0;
    }

    function getOriginalCards(track) {
        return Array.from(track.querySelectorAll(CARD_SELECTOR)).filter(card => !card.classList.contains(CLONE_CLASS));
    }

    function removeClones(track) {
        track.querySelectorAll(`.${CLONE_CLASS}`).forEach(card => card.remove());
    }

    function normalizeRealIndex(index, cardsCount) {
        if (cardsCount <= 0) {
            return 0;
        }

        return ((index % cardsCount) + cardsCount) % cardsCount;
    }

    function getCardStepFromCard(card, track) {
        if (!card) {
            return 0;
        }

        return card.getBoundingClientRect().width + getGap(track);
    }

    function getCurrentStep(state) {
        const first = state.track.children[0];
        if (!first) {
            return 0;
        }

        return first.getBoundingClientRect().width + getGap(state.track);
    }

    function getVisibleCardsApprox(state, cardStep) {
        const containerWidth = state.sliderContainer.getBoundingClientRect().width;
        if (cardStep <= 0 || containerWidth <= 0) {
            return 1;
        }

        return Math.max(1, Math.ceil(containerWidth / cardStep));
    }

    function getLoopBufferCount(state, cards, cardsCount) {
        const cardStep = getCardStepFromCard(cards[0], state.track);
        const visibleCards = getVisibleCardsApprox(state, cardStep);
        const safetyCards = 2;

        // Need enough clones to cover all visible cards + tail on both sides.
        return Math.max(visibleCards + safetyCards, 3, cardsCount > 1 ? 2 : 0);
    }

    function createCloneFromCard(card) {
        const clone = card.cloneNode(true);
        clone.classList.add(CLONE_CLASS);
        clone.setAttribute('aria-hidden', 'true');
        return clone;
    }

    function addLoopClones(track, cards, cardsCount, bufferCount) {
        const prefix = document.createDocumentFragment();
        const suffix = document.createDocumentFragment();

        for (let i = bufferCount; i >= 1; i -= 1) {
            const sourceIndex = normalizeRealIndex(-i, cardsCount);
            prefix.appendChild(createCloneFromCard(cards[sourceIndex]));
        }

        for (let i = 0; i < bufferCount; i += 1) {
            const sourceIndex = normalizeRealIndex(i, cardsCount);
            suffix.appendChild(createCloneFromCard(cards[sourceIndex]));
        }

        track.insertBefore(prefix, track.firstChild);
        track.appendChild(suffix);
    }

    function setTrackPosition(state, withAnimation) {
        const step = getCurrentStep(state);
        state.track.style.transition = withAnimation ? TRANSITION_VALUE : 'none';
        state.track.style.transform = `translate3d(${-state.currentIndex * step}px, 0, 0)`;
    }

    function setControlsDisabled(state, disabled) {
        state.prevButton.disabled = disabled;
        state.nextButton.disabled = disabled;
    }

    function getCurrentRealIndex(state) {
        return normalizeRealIndex(state.currentIndex - state.loopOffset, state.cardsCount);
    }

    function updateProgress(state) {
        if (!state.progress || !state.progressFill) {
            return;
        }

        const cardsCount = state.cardsCount;
        const currentReal = cardsCount > 0 ? getCurrentRealIndex(state) : 0;
        const currentHuman = cardsCount > 0 ? currentReal + 1 : 1;
        const progressPercent = cardsCount > 0 ? (currentHuman / cardsCount) * 100 : 0;

        state.progressFill.style.width = `${progressPercent}%`;
        state.progress.setAttribute('aria-valuemin', '1');
        state.progress.setAttribute('aria-valuemax', String(Math.max(cardsCount, 1)));
        state.progress.setAttribute('aria-valuenow', String(currentHuman));
    }

    function createSlider(section) {
        const track = section.querySelector(TRACK_SELECTOR);
        const sliderContainer = section.querySelector(CONTAINER_SELECTOR);
        const prevButton = section.querySelector(PREV_BUTTON_SELECTOR);
        const nextButton = section.querySelector(NEXT_BUTTON_SELECTOR);
        const progress = section.querySelector(PROGRESS_SELECTOR);
        const progressFill = section.querySelector(PROGRESS_FILL_SELECTOR);

        if (!track || !sliderContainer || !prevButton || !nextButton) {
            return null;
        }

        const state = {
            section,
            track,
            sliderContainer,
            prevButton,
            nextButton,
            progress,
            progressFill,
            cardsCount: 0,
            loopOffset: 0,
            currentIndex: 0,
            isAnimating: false,
            isRebuilding: false,
            resizeTimer: null,
            resizeObserver: null,
            mutationObserver: null,
        };

        function rebuild(preserveCurrent = true) {
            if (state.isRebuilding) {
                return;
            }

            state.isRebuilding = true;
            const previousCardsCount = state.cardsCount;
            const previousRealIndex = previousCardsCount > 0 ? getCurrentRealIndex(state) : 0;

            removeClones(track);
            const cards = getOriginalCards(track);
            state.cardsCount = cards.length;

            if (state.cardsCount <= 1) {
                state.loopOffset = 0;
                state.currentIndex = 0;
                state.isAnimating = false;
                state.track.style.transition = 'none';
                state.track.style.transform = 'translate3d(0, 0, 0)';
                setControlsDisabled(state, true);
                updateProgress(state);
                state.isRebuilding = false;
                return;
            }

            const loopBufferCount = getLoopBufferCount(state, cards, state.cardsCount);
            addLoopClones(track, cards, state.cardsCount, loopBufferCount);
            state.loopOffset = loopBufferCount;

            const targetRealIndex = preserveCurrent && previousCardsCount > 0
                ? Math.min(previousRealIndex, state.cardsCount - 1)
                : 0;

            state.currentIndex = state.loopOffset + targetRealIndex;
            state.isAnimating = false;
            setControlsDisabled(state, false);
            setTrackPosition(state, false);
            updateProgress(state);
            state.isRebuilding = false;
        }

        function normalizeLoopPosition() {
            if (state.cardsCount <= 1) {
                return;
            }

            const minIndex = state.loopOffset;
            const maxIndex = state.loopOffset + state.cardsCount - 1;

            if (state.currentIndex < minIndex) {
                state.currentIndex += state.cardsCount;
                setTrackPosition(state, false);
            } else if (state.currentIndex > maxIndex) {
                state.currentIndex -= state.cardsCount;
                setTrackPosition(state, false);
            }
        }

        function move(direction) {
            if (state.cardsCount <= 1 || state.isAnimating || state.isRebuilding) {
                return;
            }

            state.isAnimating = true;
            state.currentIndex += direction;
            setTrackPosition(state, true);
        }

        function scheduleRebuild() {
            clearTimeout(state.resizeTimer);
            state.resizeTimer = setTimeout(() => {
                rebuild(true);
            }, RESIZE_DEBOUNCE_MS);
        }

        state.prevButton.addEventListener('click', () => move(-1));
        state.nextButton.addEventListener('click', () => move(1));

        state.track.addEventListener('transitionend', event => {
            if (event.propertyName !== 'transform' || state.cardsCount <= 1) {
                return;
            }

            normalizeLoopPosition();
            state.isAnimating = false;
            updateProgress(state);
        });

        if (typeof MutationObserver !== 'undefined') {
            state.mutationObserver = new MutationObserver(mutations => {
                if (state.isRebuilding) {
                    return;
                }

                const hasRealCardChange = mutations.some(mutation => {
                    if (mutation.type !== 'childList') {
                        return false;
                    }

                    const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
                    return changedNodes.some(node => {
                        if (!(node instanceof HTMLElement)) {
                            return false;
                        }

                        return node.matches(CARD_SELECTOR) && !node.classList.contains(CLONE_CLASS);
                    });
                });

                if (hasRealCardChange) {
                    rebuild(true);
                }
            });

            state.mutationObserver.observe(state.track, { childList: true });
        }

        if (typeof ResizeObserver !== 'undefined') {
            state.resizeObserver = new ResizeObserver(scheduleRebuild);
            state.resizeObserver.observe(state.section);
            state.resizeObserver.observe(state.sliderContainer);
            state.resizeObserver.observe(state.track);
        }

        window.addEventListener('resize', scheduleRebuild);
        window.addEventListener('orientationchange', scheduleRebuild);
        window.addEventListener('load', scheduleRebuild);

        rebuild(false);
        return state;
    }

    function initPopularSlider() {
        const section = document.querySelector(SECTION_SELECTOR);
        if (!section) {
            return;
        }

        createSlider(section);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPopularSlider);
    } else {
        initPopularSlider();
    }
})();
