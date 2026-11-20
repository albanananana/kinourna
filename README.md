# Киноурна

**Живая версия: [kinourna.vercel.app](https://kinourna.vercel.app)**

Каждый тайно загадывает фильмы, потом урна, голосование или вычёркивание решают, что смотреть.
Без регистрации: создаёшь комнату, кидаешь друзьям ссылку или 4-буквенный код.

## Как это устроено

| Часть | Чем сделано |
|---|---|
| Сайт и API | Next.js 16 (App Router), React 19, Tailwind 4, Motion |
| Фильмы, сериалы, мульты | TMDB API — русские и английские названия, постеры, описания |
| Комнаты и синхронизация | Supabase: Postgres + Realtime |
| Хостинг | Vercel (Hobby, бесплатно) |

- Публичное состояние комнаты лежит в таблице `rooms`, браузеры получают его через Supabase Realtime.
- Тайные данные (кто что загадал, бюллетени) лежат в `room_secrets`, их читает только сервер.
- Все действия идут через `/api/rooms/[code]/action`, где сервер проверяет права и бросает жребий.
- Игровая логика — чистые функции в `lib/game.ts`, покрыта тестами (`npm test`).

## Запуск у себя

```bash
npm install
npm run dev
```

Без ключей тоже работает: поиск идёт по демо-каталогу из 16 фильмов, а комнаты хранятся в памяти.
Этого хватит, чтобы потыкать приложение в нескольких вкладках.

Чтобы искалось всё, создай `.env.local` по образцу `.env.example` и заполни ключи (см. ниже).

## Ключи

### TMDB (поиск фильмов)

1. Зарегистрируйся на [themoviedb.org](https://www.themoviedb.org/signup).
2. Settings → API → Create → Developer. В форме укажи личный некоммерческий проект, URL — любой (например, адрес на Vercel).
3. Скопируй **API Read Access Token** (длинный) или **API Key** (короткий) в `TMDB_API_KEY`.

### Supabase (комнаты и синхронизация)

1. Создай проект на [supabase.com](https://supabase.com), регион — **Central EU (Frankfurt)**.
2. SQL Editor → New query → вставь содержимое [`supabase/schema.sql`](supabase/schema.sql) → Run.
3. Project Settings → API Keys:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Secret key → `SUPABASE_SECRET_KEY` (никому не показывать, в браузер не попадает)

## Деплой на Vercel

1. Залей репозиторий на GitHub.
2. vercel.com → Add New → Project → выбери репозиторий.
3. В Environment Variables добавь все переменные из `.env.example`.
   `CRON_SECRET` — любая длинная случайная строка.
4. Deploy.

Раз в сутки Vercel Cron вызывает `/api/cron`. Он удаляет комнаты, в которых 3 дня ничего не происходило,
и заодно не даёт бесплатному Supabase-проекту «уснуть» от простоя.

## Что внутри

```
app/                 страницы и API-маршруты
components/room/     экраны комнаты: Lobby → Collect → Board → Play* → Result
components/ui/       билет, табло, постер, кнопки
lib/game.ts          правила: урна, голосование, вычёркивание
lib/server/          хранилище, TMDB, обработка действий
supabase/schema.sql  таблицы и права
```

Данные о фильмах предоставлены [TMDB](https://www.themoviedb.org/). Этот продукт использует TMDB API, но не одобрен и не сертифицирован TMDB.

## Лицензия

MIT — бери, переделывай, запускай для своей компании.
