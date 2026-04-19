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
1. Разверните `server/` на Node.js-хостинге.
2. Разверните `client/` на статическом хостинге.
3. Если сайт и API на разных доменах, укажите адрес API в файле `client/scripts/browser/api-base-config.js`.
4. В этом файле задайте значение `API_BASE_OVERRIDE`, например: `https://api.example.com/api`.
5. Если сайт и API на одном домене, оставьте `API_BASE_OVERRIDE` пустым — будет использоваться относительный путь `/api`.

## Полезно знать
- Данные контента хранятся в `server/storage/data/articles.json`.
- Загруженные файлы лежат в `server/storage/uploads/`.
- Если после прямых правок контента нужен актуальный поиск, запустите `node build/generate-search-index.mjs` из корня проекта.
