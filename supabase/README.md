# Supabase setup

## Что хранится в базе

- `feedback_requests`: заявки из формы обратной связи
- `restaurants`: карточки ресторанов для блока "Популярные рестораны"

## Как подключить проект

1. Создай проект в Supabase.
2. Открой `SQL Editor`.
3. Выполни содержимое файла `supabase/schema.sql`.
4. В `Project Settings -> API` скопируй:
   - `Project URL`
   - `anon public key`
5. Подставь их в `js/supabase-config.js`.

## Важно

- `anon` key можно использовать на клиенте.
- `service_role` key нельзя вставлять в фронтенд.
- Доступ регулируется RLS-политиками в `schema.sql`.

## Какие поля используются на сайте

### feedback_requests

- `name`
- `email`
- `phone`
- `message`
- `personal_data_consent`
- `terms_consent`
- `source_page`
- `created_at`

### restaurants

- `name`
- `cuisine`
- `short_description`
- `image_url`
- `website_url`
- `is_published`
- `sort_order`

## Что происходит на сайте

- форма отправляет запись в `feedback_requests`
- секция ресторанов читает опубликованные записи из `restaurants`
- если Supabase ещё не настроен, вместо БД показываются демо-карточки
