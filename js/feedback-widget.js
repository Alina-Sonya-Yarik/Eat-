(() => {
    const root = document.querySelector('[data-feedback-widget]');

    if (!root) {
        return;
    }

    const morph = root.querySelector('.feedback-widget__morph');
    const openButton = root.querySelector('[data-feedback-open]');
    const closeButton = root.querySelector('[data-feedback-close]');
    const overlay = root.querySelector('[data-feedback-overlay]');
    const form = root.querySelector('[data-feedback-form]');
    const phoneInput = root.querySelector('[data-feedback-phone]');
    const statusNode = root.querySelector('[data-feedback-status]');
    const firstInput = form ? form.querySelector('input, textarea') : null;
    const EMPTY_PHONE_MASK = '+7 (___) ___ __-__';
    const CLOSE_CLASS_DELAY_MS = 360;
    let closeClassTimer = null;

    if (!morph || !openButton || !closeButton || !overlay || !form || !statusNode) {
        return;
    }

    function setStatus(message, isError = false) {
        statusNode.textContent = message;
        statusNode.classList.toggle('is-error', isError);
    }

    function lockPageScroll(shouldLock) {
        document.body.classList.toggle('feedback-lock-scroll', shouldLock);
    }

    function normalizePhoneDigits(value) {
        const normalizedValue = (value || '').trim();
        let digits = normalizedValue.replace(/\D/g, '');

        if (!digits.length) {
            return '';
        }

        if (normalizedValue.startsWith('+7') && digits.startsWith('7')) {
            digits = digits.slice(1);
        }

        if ((digits.startsWith('7') || digits.startsWith('8')) && digits.length === 11) {
            digits = digits.slice(1);
        }

        return digits.slice(0, 10);
    }

    function formatPhoneNumber(digits) {
        if (!digits.length) {
            return EMPTY_PHONE_MASK;
        }

        const a = digits.slice(0, 3);
        const b = digits.slice(3, 6);
        const c = digits.slice(6, 8);
        const d = digits.slice(8, 10);
        let result = `+7 (${a}`;

        if (digits.length >= 3) {
            result += ')';
        }

        if (b) {
            result += ` ${b}`;
        }

        if (c) {
            result += ` ${c}`;
        }

        if (d) {
            result += `-${d}`;
        }

        return result;
    }

    function moveCaretToEnd(input) {
        requestAnimationFrame(() => {
            const pos = input.value.length;
            input.setSelectionRange(pos, pos);
        });
    }

    function applyPhoneMask() {
        if (!phoneInput) {
            return;
        }

        const digits = normalizePhoneDigits(phoneInput.value);
        phoneInput.value = formatPhoneNumber(digits);
        moveCaretToEnd(phoneInput);
    }

    function handlePhoneBackspace(event) {
        if (!phoneInput || event.key !== 'Backspace') {
            return;
        }

        const selectionStart = phoneInput.selectionStart ?? 0;
        const selectionEnd = phoneInput.selectionEnd ?? 0;

        if (selectionStart !== selectionEnd || selectionStart === 0) {
            return;
        }

        const previousChar = phoneInput.value.charAt(selectionStart - 1);

        if (/\d/.test(previousChar) || previousChar === '_') {
            return;
        }

        event.preventDefault();
        const digits = normalizePhoneDigits(phoneInput.value);
        const nextDigits = digits.slice(0, Math.max(0, digits.length - 1));
        phoneInput.value = formatPhoneNumber(nextDigits);
        moveCaretToEnd(phoneInput);
        validateOptionalPhone();
    }

    function validateOptionalPhone() {
        if (!phoneInput) {
            return true;
        }

        const digits = normalizePhoneDigits(phoneInput.value);

        if (digits.length === 0) {
            phoneInput.setCustomValidity('');
            return true;
        }

        if (digits.length < 10) {
            phoneInput.setCustomValidity('Введите номер полностью в формате +7 (000) 000 00-00.');
            return false;
        }

        phoneInput.setCustomValidity('');
        return true;
    }

    function isWidgetOpen() {
        return root.classList.contains('is-open');
    }

    function setExpanded(value) {
        openButton.setAttribute('aria-expanded', String(value));
        morph.setAttribute('aria-hidden', String(!value));
    }

    function clearCloseTimer() {
        if (!closeClassTimer) {
            return;
        }

        clearTimeout(closeClassTimer);
        closeClassTimer = null;
    }

    function clearClosingState() {
        root.classList.remove('is-closing');
        clearCloseTimer();
    }

    function openWidget() {
        clearClosingState();
        root.classList.add('is-open');
        lockPageScroll(true);
        setExpanded(true);
        setStatus('', false);

        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
            }, 170);
        }
    }

    function closeWidget(returnFocus = true) {
        if (!isWidgetOpen() && !root.classList.contains('is-closing')) {
            return;
        }

        root.classList.remove('is-open');
        root.classList.add('is-closing');
        lockPageScroll(false);
        setExpanded(false);

        clearCloseTimer();
        closeClassTimer = setTimeout(() => {
            clearClosingState();
        }, CLOSE_CLASS_DELAY_MS);

        if (returnFocus) {
            openButton.focus();
        }
    }

    openButton.addEventListener('click', () => {
        openWidget();
    });

    closeButton.addEventListener('click', () => {
        closeWidget();
    });

    overlay.addEventListener('click', () => {
        closeWidget(true);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && (isWidgetOpen() || root.classList.contains('is-closing'))) {
            closeWidget(false);
        }
    });

    morph.addEventListener('transitionend', event => {
        if (event.propertyName !== 'width') {
            return;
        }

        if (!isWidgetOpen()) {
            clearClosingState();
        }
    });

    if (phoneInput) {
        phoneInput.value = formatPhoneNumber(normalizePhoneDigits(phoneInput.value));

        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value.trim()) {
                phoneInput.value = EMPTY_PHONE_MASK;
            }
        });

        phoneInput.addEventListener('keydown', event => {
            handlePhoneBackspace(event);
        });

        phoneInput.addEventListener('input', () => {
            applyPhoneMask();
            validateOptionalPhone();
        });

        phoneInput.addEventListener('paste', event => {
            event.preventDefault();
            const clipboardText = event.clipboardData ? event.clipboardData.getData('text') : '';
            const digits = normalizePhoneDigits(clipboardText);
            phoneInput.value = formatPhoneNumber(digits);
            moveCaretToEnd(phoneInput);
            validateOptionalPhone();
        });

        phoneInput.addEventListener('blur', () => {
            validateOptionalPhone();
        });
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        setStatus('', false);
        validateOptionalPhone();

        if (!form.checkValidity()) {
            setStatus('Проверьте поля формы и подтвердите согласия.', true);
            form.reportValidity();
            return;
        }

        form.reset();

        if (phoneInput) {
            phoneInput.value = EMPTY_PHONE_MASK;
        }

        setStatus('Спасибо, мы получили ваш вопрос.', false);
    });

    setExpanded(false);
})();
