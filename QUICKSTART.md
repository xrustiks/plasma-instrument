# Plasma Instrument - Руководство по развёртыванию

## Структура проекта

Проект разделен на две основные папки:

```
plasma-instrument/
├── client/           # Фронтэнд (статический сайт)
├── server/           # Бэкэнд (CMS, админка)
├── build/            # Утилиты сборки
└── .git/            # Репозиторий
```

## Запуск фронтэнда локально

Фронтэнд находится в папке `client/` и готов к использованию.

### Простой способ (локальный сервер)

```bash
cd client
python -m http.server 8000
# или
npx http-server
# или используйте Live Server в VS Code
```

Откройте http://localhost:8000

## Генерация поискового индекса

После любых изменений в контенте в папке `client/`:

```bash
# Из корня проекта
node build/generate-search-index.mjs
```

Это создаст/обновит `client/search-index.json`

## Текущее состояние

✅ Фронтэнд полностью функционален  
✅ Структура проекта разделена на client/server  
✅ Build-скрипты работают с новой структурой  
⏳ Бэкэнд (CMS) - на следующем этапе

## Что где находится

- **Главная страница (RU)**: `client/index.html`
- **Главная страница (EN)**: `client/en/index.html`
- **Стили**: `client/styles.css`
- **JS фронтэнда**: `client/scripts/browser/`
- **Контент**: `client/sections/` + `client/en/sections/`
- **Поиск**: `client/search.html`
- **Индекс поиска**: `client/search-index.json` (генерируется автоматически)

## Для разработчиков

### Добавить новую страницу

1. Создать папку в `client/sections/{section}/{slug}/`
2. Создать `index.html` с нужным контентом
3. Запустить `node build/generate-search-index.mjs`

### Структура страницы

Используйте как шаблон любую существующую страницу из `client/sections/blog/`

Обязательные элементы:
- `<html lang="ru" data-depth="3">` (depth зависит от уровня вложенности)
- `<title>` (для поиска)
- `<main class="section reveal">` (контент)
- `<link rel="stylesheet" href="../../../styles.css">`
- Скрипты в конце body

### Добавить новый раздел

1. Создать папку в `client/sections/{новый_раздел}/`
2. Создать `index.html` с листингом страниц раздела
3. Обновить `build/generate-search-index.mjs` (добавить в `SECTION_ORDER` и `SECTION_LABELS`)
4. Обновить навигацию в `client/scripts/browser/components/header.html`

## Развёртывание

Фронтэнд можно развернуть на любом статическом хостинге (Netlify, Vercel, GitHub Pages и т.д.)

Просто используйте `client/` как root directory.

## Следующие шаги

1. Разработка бэкэнда (CMS) в папке `server/`
2. Миграция контента в БД
3. Автоматическое генерирование статических страниц из CMS
