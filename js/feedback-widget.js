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
    const content = root.querySelector('.feedback-widget__content');
    const phoneInput = root.querySelector('[data-feedback-phone]');
    const statusNode = root.querySelector('[data-feedback-status]');
    const firstInput = form ? form.querySelector('input, textarea') : null;
    const EMPTY_PHONE_MASK = '+7 (___) ___ __-__';
    const CLOSE_CLASS_DELAY_MS = 360;
    let closeClassTimer = null;
    let lockedScrollY = 0;

    if (!morph || !openButton || !closeButton || !overlay || !form || !content || !statusNode) {
        return;
    }

    function setStatus(message, isError = false) {
        statusNode.textContent = message;
        statusNode.classList.toggle('is-error', isError);
    }

    function getFriendlyErrorMessage(error) {
        const message = error && typeof error.message === 'string' ? error.message : '';

        if (message.includes('feedback_requests_message_length_check')) {
            return 'Сообщение должно содержать от 6 до 2000 символов.';
        }

        if (message.includes('feedback_requests_name_length_check')) {
            return 'Имя должно содержать от 2 до 120 символов.';
        }

        if (message.includes('feedback_requests_email_length_check')) {
            return 'Проверьте корректность электронной почты.';
        }

        if (message.includes('feedback_requests_phone_format_check')) {
            return 'Телефон должен быть пустым или содержать 10 цифр после +7.';
        }

        if (message.includes('row-level security policy')) {
            return 'Проверьте обязательные согласия перед отправкой формы.';
        }

        return 'Не удалось отправить форму. Попробуйте еще раз.';
    }

    function getSupabaseClient() {
        if (!window.appSupabase || typeof window.appSupabase.getClient !== 'function') {
            return null;
        }

        return window.appSupabase.getClient();
    }

    function lockPageScroll(shouldLock) {
        const body = document.body;

        if (shouldLock) {
            lockedScrollY = window.scrollY || window.pageYOffset || 0;
            body.style.setProperty('--feedback-scroll-lock-top', `-${lockedScrollY}px`);
            body.classList.add('feedback-lock-scroll');
            return;
        }

        body.classList.remove('feedback-lock-scroll');
        body.style.removeProperty('--feedback-scroll-lock-top');
        window.scrollTo(0, lockedScrollY);
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

    function getViewportInset() {
        if (window.innerWidth <= 480) {
            return 20;
        }

        if (window.innerWidth <= 834) {
            return 32;
        }

        if (window.innerWidth <= 1194) {
            return 40;
        }

        return 48;
    }

    function getHorizontalInset() {
        if (window.innerWidth <= 480) {
            return 12;
        }

        if (isFullWidthLayout()) {
            return 16;
        }

        return 0;
    }

    function isFullWidthLayout() {
        return window.innerWidth <= 834
            || (window.innerWidth <= 1194 && window.matchMedia('(orientation: portrait)').matches);
    }

    function getOpenWidth() {
        const viewportWidth = document.documentElement.clientWidth || window.innerWidth;

        if (isFullWidthLayout()) {
            return Math.max(280, viewportWidth - (getHorizontalInset() * 2));
        }

        if (viewportWidth <= 1194) {
            return Math.max(320, ((viewportWidth - 128) * 5 / 6) - 2.67);
        }

        if (viewportWidth <= 1440) {
            return Math.max(360, ((viewportWidth - 160) * 2 / 3) - 5.34);
        }

        return Math.max(360, ((viewportWidth - 160) / 2) - 8);
    }

    function getContentHeightForWidth(targetWidth) {
        const measureNode = document.createElement('div');
        const contentClone = content.cloneNode(true);

        measureNode.className = 'feedback-widget__measure';
        measureNode.style.width = `${Math.ceil(targetWidth)}px`;
        measureNode.appendChild(contentClone);
        document.body.appendChild(measureNode);

        const measuredHeight = Math.ceil(measureNode.scrollHeight);
        measureNode.remove();

        return measuredHeight;
    }

    function syncOpenSize() {
        morph.style.removeProperty('--feedback-open-width');
        morph.style.removeProperty('--feedback-open-height');

        const targetWidth = getOpenWidth();
        const maxHeight = Math.max(320, window.innerHeight - getViewportInset());
        const contentHeight = getContentHeightForWidth(targetWidth);
        const targetHeight = Math.min(contentHeight + 7, maxHeight);

        morph.style.setProperty('--feedback-open-width', `${Math.ceil(targetWidth)}px`);
        morph.style.setProperty('--feedback-open-height', `${targetHeight}px`);
    }

    function openWidget() {
        clearClosingState();
        syncOpenSize();
        root.classList.add('is-open');
        lockPageScroll(true);
        setExpanded(true);
        setStatus('', false);

        if (firstInput) {
            setTimeout(() => {
                firstInput.focus();
            }, 620);
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

    window.addEventListener('resize', () => {
        if (!isWidgetOpen()) {
            return;
        }

        syncOpenSize();
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

    form.addEventListener('submit', async event => {
        event.preventDefault();
        setStatus('', false);
        validateOptionalPhone();

        if (!form.checkValidity()) {
            setStatus('Проверьте поля формы и подтвердите согласия.', true);
            form.reportValidity();
            return;
        }

        const submitButton = form.querySelector('.feedback-widget__submit');
        const supabase = getSupabaseClient();
        const formData = new FormData(form);
        const emailValue = String(formData.get('email') || '').trim().toLowerCase();
        const phoneDigits = normalizePhoneDigits(String(formData.get('phone') || ''));
        const payload = {
            name: String(formData.get('name') || '').trim(),
            email: emailValue,
            phone: phoneDigits || null,
            message: String(formData.get('message') || '').trim(),
            personal_data_consent: Boolean(formData.get('personalDataConsent')),
            terms_consent: Boolean(formData.get('termsConsent')),
            source_page: window.location.pathname,
        };

        if (!supabase) {
            setStatus('Заполните `js/supabase-config.js`, чтобы включить отправку формы в базу.', true);
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Отправляем...';
        }

        try {
            const { error } = await supabase.from('feedback_requests').insert(payload);

            if (error) {
                throw error;
            }

            form.reset();

            if (phoneInput) {
                phoneInput.value = EMPTY_PHONE_MASK;
            }

            setStatus('Спасибо, мы получили ваш вопрос.', false);
        } catch (error) {
            console.error('Failed to submit feedback request:', error);
            setStatus(getFriendlyErrorMessage(error), true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Отправить';
            }
        }
    });

    setExpanded(false);
})();
