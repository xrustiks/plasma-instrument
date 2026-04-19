# Plasma Instrument Quickstart

## Локально
1. Запустите сервер:

```bash
cd server
npm install
npm start
```

2. Запустите сайт на фиксированном порту:
```bash
cd client
npx http-server -p 8080
```

3. Откройте сайт в браузере и введите в адресную строку:
```text
http://localhost:8080/
```

4. Если нужно проверить API, откройте:
```text
http://localhost:3000/api
```

## Продакшен
1. Разверните `server/` на Node.js-хостинге и задайте правильный `PORT`.
2. Разверните `client/` на статическом хостинге.
3. Укажите для клиента адрес продакшен-API, если сайт и API находятся на разных доменах. Базовый префикс API — `/api`, например `/api/health` или `/api/articles`.

## Полезно знать

- Данные контента хранятся в `server/storage/data/articles.json`.
- Загруженные файлы лежат в `server/storage/uploads/`.
- Если после прямых правок контента нужен актуальный поиск, запустите `node build/generate-search-index.mjs` из корня проекта.

