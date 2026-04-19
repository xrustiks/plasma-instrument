# Plasma Instrument Quickstart

## Локально
1. Запустите сервер:
```bash
cd server
npm install
cp .env.example .env
# отредактируйте .env и задайте ADMIN_BASIC_AUTH_USERNAME/ADMIN_BASIC_AUTH_PASSWORD
npm start
```
2. Откройте сайт в браузере и введите в адресную строку:
```text
http://localhost:3000/
```
3. Если нужно проверить API, откройте:
```text
http://localhost:3000/api
```

## Админка
1. Откройте в браузере:
```text
http://localhost:3000/admin/
```
2. Если вход не выполнен, система перенаправит на страницу логина.
3. Введите логин и пароль из файла `server/.env`.
4. После входа откроется админ-панель. В ней можно выбирать раздел, добавлять, редактировать и удалять статьи.
5. Чтобы выйти, закройте вкладку или очистите cookie для `localhost:3000`.

Если нужен отдельный статический сервер для клиента, можно дополнительно запустить `npx http-server -p 8080`, но для админки и API удобнее использовать `http://localhost:3000/`.

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
