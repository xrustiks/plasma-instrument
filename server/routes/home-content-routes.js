import { Router } from 'express';
import {
  HOME_CONTENT_SECTION_IDS,
  readHomeContent,
  saveHomeContent,
  withHomeContentLock
} from '../storage/home-content-store.js';
import { requireAdminAuth } from '../middleware/admin-basic-auth.js';

const router = Router();
const sectionSet = new Set(HOME_CONTENT_SECTION_IDS);
const ALLOWED_ICON_KEYS = new Set(['bolt', 'target', 'science', 'team', 'suppliers', 'docs', 'approval', 'support', 'cad']);

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeId(value, fallbackPrefix, index) {
  const normalized = trimString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || `${fallbackPrefix}-${index + 1}`;
}

function validateUrl(value, { required = false } = {}) {
  const url = trimString(value);

  if (!url) {
    return required ? null : '';
  }

  if (url.startsWith('/uploads/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

function validateAbout(items) {
  if (!Array.isArray(items)) {
    return { error: 'about must be an array' };
  }

  const normalized = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    const type = trimString(item.type) === 'number' ? 'number' : 'icon';
    const number = trimString(item.number);
    const iconKey = trimString(item.iconKey);
    const iconUrl = validateUrl(item.iconUrl);

    if (type === 'number' && !number) {
      return { error: `about[${index}] number is required when type=number` };
    }

    if (type === 'icon' && !iconUrl && !ALLOWED_ICON_KEYS.has(iconKey || '')) {
      return { error: `about[${index}] iconKey is invalid` };
    }

    const titleRu = trimString(item.titleRu);
    const titleEn = trimString(item.titleEn);
    const textRu = trimString(item.textRu);
    const textEn = trimString(item.textEn);

    if (!titleRu || !titleEn || !textRu || !textEn) {
      return { error: `about[${index}] title and text fields are required for both languages` };
    }

    normalized.push({
      id: normalizeId(item.id, 'about', index),
      type,
      number: type === 'number' ? number : '',
      iconKey: type === 'icon' ? iconKey : '',
      iconUrl: type === 'icon' ? iconUrl : '',
      titleRu,
      titleEn,
      textRu,
      textEn
    });
  }

  return { value: normalized };
}

function validateBenefits(items) {
  if (!Array.isArray(items)) {
    return { error: 'benefits must be an array' };
  }

  const normalized = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    const iconKey = trimString(item.iconKey);
    const iconUrl = validateUrl(item.iconUrl);
    const titleRu = trimString(item.titleRu);
    const titleEn = trimString(item.titleEn);

    if (!iconUrl && !ALLOWED_ICON_KEYS.has(iconKey)) {
      return { error: `benefits[${index}] iconKey is invalid` };
    }

    if (!titleRu || !titleEn) {
      return { error: `benefits[${index}] titleRu/titleEn are required` };
    }

    normalized.push({
      id: normalizeId(item.id, 'benefit', index),
      iconKey,
      iconUrl,
      titleRu,
      titleEn
    });
  }

  return { value: normalized };
}

function validateTestimonials(items) {
  if (!Array.isArray(items)) {
    return { error: 'testimonials must be an array' };
  }

  const normalized = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    const imageUrl = validateUrl(item.imageUrl, { required: true });

    if (!imageUrl) {
      return { error: `testimonials[${index}] imageUrl is invalid` };
    }

    const companyRu = trimString(item.companyRu);
    const companyEn = trimString(item.companyEn);
    const textRu = trimString(item.textRu);
    const textEn = trimString(item.textEn);
    const imageAltRu = trimString(item.imageAltRu);
    const imageAltEn = trimString(item.imageAltEn);

    if (!companyRu || !companyEn || !textRu || !textEn) {
      return { error: `testimonials[${index}] company and text fields are required for both languages` };
    }

    normalized.push({
      id: normalizeId(item.id, 'testimonial', index),
      imageUrl,
      imageAltRu,
      imageAltEn,
      companyRu,
      companyEn,
      textRu,
      textEn
    });
  }

  return { value: normalized };
}

function validatePartners(items) {
  if (!Array.isArray(items)) {
    return { error: 'partners must be an array' };
  }

  const normalized = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    const imageUrl = validateUrl(item.imageUrl, { required: true });

    if (!imageUrl) {
      return { error: `partners[${index}] imageUrl is invalid` };
    }

    normalized.push({
      id: normalizeId(item.id, 'partner', index),
      imageUrl,
      altRu: trimString(item.altRu),
      altEn: trimString(item.altEn)
    });
  }

  return { value: normalized };
}

function validateSectionItems(section, items) {
  if (section === 'about') {
    return validateAbout(items);
  }

  if (section === 'benefits') {
    return validateBenefits(items);
  }

  if (section === 'testimonials') {
    return validateTestimonials(items);
  }

  return validatePartners(items);
}

router.get('/', async (req, res) => {
  try {
    const content = await readHomeContent();
    return res.json(content);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:section', requireAdminAuth, async (req, res) => {
  try {
    const section = trimString(req.params.section);

    if (!sectionSet.has(section)) {
      return res.status(400).json({ error: 'Unknown home content section' });
    }

    const validation = validateSectionItems(section, req.body?.items);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const nextItems = validation.value;

    const payload = await withHomeContentLock(async () => {
      const content = await readHomeContent();
      const nextContent = {
        ...content,
        [section]: nextItems
      };

      await saveHomeContent(nextContent);
      return nextContent;
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
