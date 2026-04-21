import './api-base-config.js';

const API_BASE = typeof window.__resolveApiBase === 'function'
  ? window.__resolveApiBase()
  : '/api';

function getLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

function pickByLang(payload, keyRu, keyEn, lang) {
  if (lang === 'en') {
    return payload[keyEn] || payload[keyRu] || '';
  }

  return payload[keyRu] || payload[keyEn] || '';
}

function applyTextBindings(payload, lang) {
  const textMap = {
    phoneDisplay: payload.phoneDisplay || '',
    email: payload.email || '',
    addressFull: pickByLang(payload, 'addressRuFull', 'addressEnFull', lang),
    addressShort: pickByLang(payload, 'addressRuShort', 'addressEnShort', lang),
    contactsLead: pickByLang(payload, 'contactsLeadRu', 'contactsLeadEn', lang),
    workingHours: pickByLang(payload, 'workingHoursRu', 'workingHoursEn', lang),
    workingHoursShort: pickByLang(payload, 'workingHoursRuShort', 'workingHoursEnShort', lang),
    responseTime: pickByLang(payload, 'responseTimeRu', 'responseTimeEn', lang)
  };

  document.querySelectorAll('[data-contact-text]').forEach((node) => {
    const key = node.getAttribute('data-contact-text') || '';
    if (!(key in textMap)) {
      return;
    }

    node.textContent = textMap[key];
  });
}

function applyLinkBindings(payload) {
  const tel = payload.phoneRaw || '';
  const email = payload.email || '';

  document.querySelectorAll('[data-contact-link]').forEach((node) => {
    const key = node.getAttribute('data-contact-link') || '';

    if (key === 'phone') {
      node.setAttribute('href', `tel:${tel}`);
      return;
    }

    if (key === 'email') {
      node.setAttribute('href', `mailto:${email}`);
    }
  });
}

async function fetchContactsContent() {
  const response = await fetch(`${API_BASE}/contacts-content`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`contacts content request failed: ${response.status}`);
  }

  return response.json();
}

export async function initContactsContent() {
  const hasBindings = Boolean(document.querySelector('[data-contact-text], [data-contact-link]'));
  if (!hasBindings) {
    return;
  }

  try {
    const payload = await fetchContactsContent();
    const lang = getLang();

    applyTextBindings(payload, lang);
    applyLinkBindings(payload);
  } catch (error) {
    console.error('[contacts-content] failed to load dynamic contacts data', error);
  }
}
