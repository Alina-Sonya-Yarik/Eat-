(() => {
    const section = document.querySelector('.popular-restaurants');

    if (!section) {
        return;
    }

    const track = section.querySelector('.popular-slider');
    const description = section.querySelector('.popular-description');
    const interactiveMediaQuery = window.matchMedia('(min-width: 1195px) and (hover: hover) and (pointer: fine)');
    let restaurantsChannel = null;

    if (!track) {
        return;
    }

    const fallbackRestaurants = [
        {
            name: 'Ресторан 01',
            cuisine: 'Тестовая кухня',
            short_description: 'Здесь будет краткое описание ресторана для проверки верстки и композиции карточки.',
            image_url: 'https://picsum.photos/seed/restaurant-01-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-01-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-01-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 02',
            cuisine: 'Тестовая кухня',
            short_description: 'Этот текст нужен как временная рыба, чтобы проверить переносы строк и отступы.',
            image_url: 'https://picsum.photos/seed/restaurant-02-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-02-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-02-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 03',
            cuisine: 'Тестовая кухня',
            short_description: 'В будущем здесь появится короткий анонс ресторана, его формата и особенностей.',
            image_url: 'https://picsum.photos/seed/restaurant-03-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-03-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-03-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 04',
            cuisine: 'Тестовая кухня',
            short_description: 'Карточка пока заполнена рыбой, чтобы удобно настраивать размер текста и визуальный ритм.',
            image_url: 'https://picsum.photos/seed/restaurant-04-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-04-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-04-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 05',
            cuisine: 'Тестовая кухня',
            short_description: 'Здесь позже будет реальное описание заведения, его кухни и основных преимуществ.',
            image_url: 'https://picsum.photos/seed/restaurant-05-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-05-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-05-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 06',
            cuisine: 'Тестовая кухня',
            short_description: 'Текст-рыба помогает проверить, как карточка ведет себя на разных экранах и брейкпоинтах.',
            image_url: 'https://picsum.photos/seed/restaurant-06-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-06-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-06-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 07',
            cuisine: 'Тестовая кухня',
            short_description: 'Сюда можно будет вывести настоящее описание ресторана после наполнения базы данных.',
            image_url: 'https://picsum.photos/seed/restaurant-07-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-07-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-07-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 08',
            cuisine: 'Тестовая кухня',
            short_description: 'Пока это заполнитель, который нужен только для настройки карточек и текстового блока.',
            image_url: 'https://picsum.photos/seed/restaurant-08-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-08-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-08-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 09',
            cuisine: 'Тестовая кухня',
            short_description: 'Временный текст позволяет спокойно проверить ширину описания и общую читаемость.',
            image_url: 'https://picsum.photos/seed/restaurant-09-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-09-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-09-c/1200/1200',
            website_url: '',
        },
        {
            name: 'Ресторан 10',
            cuisine: 'Тестовая кухня',
            short_description: 'После подключения финальных данных эта рыба будет заменена на реальное описание ресторана.',
            image_url: 'https://picsum.photos/seed/restaurant-10-a/1200/1200',
            image_url_2: 'https://picsum.photos/seed/restaurant-10-b/1200/1200',
            image_url_3: 'https://picsum.photos/seed/restaurant-10-c/1200/1200',
            website_url: '',
        },
    ];

    function getAbsoluteUrl(value) {
        const source = String(value || '').trim();

        if (!source) {
            return '';
        }

        try {
            return new URL(source, window.location.href).toString();
        } catch {
            return '';
        }
    }

    function getPreferredImageUrl(imageUrl) {
        const absoluteUrl = getAbsoluteUrl(imageUrl);

        if (!absoluteUrl) {
            return '';
        }

        if (window.APP_ENABLE_SERVER_API === false) {
            return absoluteUrl;
        }

        try {
            const parsedUrl = new URL(absoluteUrl);
            const isSupabaseStorageUrl =
                parsedUrl.protocol === 'https:' &&
                parsedUrl.hostname.endsWith('.supabase.co') &&
                parsedUrl.pathname.startsWith('/storage/v1/object/');

            if (!isSupabaseStorageUrl) {
                return absoluteUrl;
            }

            return `/api/storage-image?src=${encodeURIComponent(absoluteUrl)}`;
        } catch {
            return absoluteUrl;
        }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildMediaMarkup(imageUrl, index) {
        const originalUrl = getAbsoluteUrl(imageUrl);
        const preferredUrl = getPreferredImageUrl(imageUrl);
        const imageMarkup = preferredUrl
            ? `<img src="${escapeHtml(preferredUrl)}" data-original-src="${escapeHtml(originalUrl)}" alt="" loading="eager" decoding="async" />`
            : '';

        return `<div class="popular-card__media popular-card__media--${index}">${imageMarkup}</div>`;
    }

    function bindImageFallbacks() {
        track.querySelectorAll('.popular-card__media img').forEach(image => {
            if (image.dataset.fallbackBound === 'true') {
                return;
            }

            image.dataset.fallbackBound = 'true';
            image.addEventListener('error', () => {
                const originalSrc = image.dataset.originalSrc || '';

                if (!originalSrc || image.dataset.fallbackApplied === 'true' || image.currentSrc === originalSrc) {
                    return;
                }

                image.dataset.fallbackApplied = 'true';
                image.src = originalSrc;
            });
        });
    }

    function createCardMarkup(restaurant) {
        const imageSet = [
            restaurant.image_url,
            restaurant.image_url_2 || restaurant.image_url,
            restaurant.image_url_3 || restaurant.image_url_2 || restaurant.image_url,
        ];
        const websiteUrl = String(restaurant.website_url || '').trim();
        const label = restaurant.cuisine ? `<p class="popular-card__eyebrow">${escapeHtml(restaurant.cuisine)}</p>` : '';
        const summary = restaurant.short_description
            ? `<p class="popular-card__summary">${escapeHtml(restaurant.short_description)}</p>`
            : '';
        const mediaMarkup = imageSet
            .map((imageUrl, index) => buildMediaMarkup(imageUrl, index + 1))
            .join('');
        const cardTag = websiteUrl ? 'a' : 'article';
        const cardAttributes = websiteUrl
            ? ` href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(restaurant.name)}"`
            : ` aria-label="${escapeHtml(restaurant.name)}"`;
        const clickableClass = websiteUrl ? ' popular-restaurant-card--clickable' : '';

        return `
            <${cardTag} class="popular-restaurant-card popular-restaurant-card--link-reset is-zone-1${clickableClass}"${cardAttributes}>
                ${mediaMarkup}
                <div class="popular-card__overlay">
                    ${label}
                    <h3 class="popular-card__title">${escapeHtml(restaurant.name)}</h3>
                    ${summary}
                </div>
            </${cardTag}>
        `;
    }

    function renderRestaurants(restaurants) {
        const items = Array.isArray(restaurants) && restaurants.length ? restaurants : fallbackRestaurants;
        track.innerHTML = items.map(createCardMarkup).join('');
        bindImageFallbacks();

        if (description && (!Array.isArray(restaurants) || !restaurants.length)) {
            description.textContent = 'Пока используем демонстрационные карточки. После заполнения таблицы restaurants данные подтянутся автоматически.';
        }
    }

    function resetCardMotion(card) {
        if (!card) {
            return;
        }

        card.style.setProperty('--card-shift-x', '0px');
        card.style.setProperty('--card-shift-y', '0px');
        card.classList.remove('is-zone-2', 'is-zone-3');
        card.classList.add('is-zone-1');
    }

    function resetAllCards() {
        track.querySelectorAll('.popular-restaurant-card').forEach(card => {
            resetCardMotion(card);

            if (document.activeElement instanceof HTMLElement && card.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        });
    }

    function updateCardMotion(card, event) {
        if (!card || !interactiveMediaQuery.matches) {
            resetCardMotion(card);
            return;
        }

        const rect = card.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            resetCardMotion(card);
            return;
        }

        const relativeX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const relativeY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        const shiftX = relativeX * 6;
        const shiftY = relativeY * 6;
        const zone = Math.min(3, Math.max(1, Math.floor(((event.clientX - rect.left) / rect.width) * 3) + 1));

        card.style.setProperty('--card-shift-x', `${shiftX.toFixed(2)}px`);
        card.style.setProperty('--card-shift-y', `${shiftY.toFixed(2)}px`);
        card.classList.remove('is-zone-1', 'is-zone-2', 'is-zone-3');
        card.classList.add(`is-zone-${zone}`);
    }

    function bindCardInteractions() {
        track.addEventListener('click', event => {
            const card = event.target instanceof Element
                ? event.target.closest('.popular-restaurant-card--clickable')
                : null;

            if (!card) {
                return;
            }

            resetAllCards();
        });

        track.addEventListener('pointermove', event => {
            const card = event.target instanceof Element
                ? event.target.closest('.popular-restaurant-card')
                : null;

            if (!card) {
                return;
            }

            updateCardMotion(card, event);
        });

        track.addEventListener('pointerleave', () => {
            resetAllCards();
        });

        track.addEventListener('pointerout', event => {
            const card = event.target instanceof Element
                ? event.target.closest('.popular-restaurant-card')
                : null;
            const relatedCard = event.relatedTarget instanceof Element
                ? event.relatedTarget.closest('.popular-restaurant-card')
                : null;

            if (card && card !== relatedCard) {
                resetCardMotion(card);
            }
        });

        interactiveMediaQuery.addEventListener('change', () => {
            resetAllCards();
        });

        window.addEventListener('pageshow', () => {
            resetAllCards();
        });
    }

    async function loadRestaurants() {
        const supabaseApi = window.appSupabase;
        const client = supabaseApi && typeof supabaseApi.getClient === 'function'
            ? supabaseApi.getClient()
            : null;

        if (!client) {
            renderRestaurants(null);
            return;
        }

        try {
            const { data, error } = await client
                .from('restaurants')
                .select('name, cuisine, short_description, image_url, image_url_2, image_url_3, website_url, sort_order')
                .eq('is_published', true)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            renderRestaurants(data);
        } catch (error) {
            console.error('Failed to load restaurants from Supabase:', error);
            renderRestaurants(null);
        }
    }

    function subscribeToRestaurants() {
        const supabaseApi = window.appSupabase;
        const client = supabaseApi && typeof supabaseApi.getClient === 'function'
            ? supabaseApi.getClient()
            : null;

        if (!client || typeof client.channel !== 'function') {
            return;
        }

        if (restaurantsChannel && typeof client.removeChannel === 'function') {
            client.removeChannel(restaurantsChannel);
        }

        restaurantsChannel = client
            .channel('public:restaurants')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'restaurants' },
                () => {
                    loadRestaurants();
                }
            )
            .subscribe();
    }

    bindCardInteractions();
    loadRestaurants();
    subscribeToRestaurants();
})();
