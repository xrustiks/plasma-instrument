(function initApiBaseResolver(global) {
  // Укажите адрес, если клиентская и серверная части развернуты в разных местах
  // Пример: 'https://api.example.com/api'
  // Если они развернуты на одном домене, оставьте пустым, 
  // и API будет доступен по относительному пути '/api'
  const API_BASE_OVERRIDE = '';

  // Убирает все слэши в конце строки, чтобы гарантировать единообразие при формировании URL
  function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
  }

  // Определяет, с какого адреса клиент запрашивает API
  function resolveApiBase() {
    const configured =
      API_BASE_OVERRIDE ||
      document.documentElement.dataset.apiBase ||
      global.__API_BASE__ ||
      '';

    if (configured) {
      return trimTrailingSlash(configured);
    }

    const { hostname, port } = global.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Если клиент запущен на localhost, а сервер на другом порту (например, 3000), 
    // используем полный URL для API
    if (isLocalHost && port && port !== '3000') {
      return 'http://localhost:3000/api';
    }

    return '/api';
  }

  // Делает функциию resolveApiBase доступной глобально
  global.__resolveApiBase = resolveApiBase;
})(window);
