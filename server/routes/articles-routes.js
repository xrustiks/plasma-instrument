import { Router } from 'express';
import {
  getNextArticleId,
  readArticles,
  saveArticles,
  withArticlesLock
} from '../storage/articles-store.js';
import { scheduleSearchIndexRebuild } from '../services/search-index-sync.js';
import { requireAdminAuth } from '../middleware/admin-basic-auth.js';
import { SECTIONS } from '../config/constants.js';

const router = Router();
const allowedSections = new Set(SECTIONS.map((section) => section.id));
const ALLOWED_ARTICLE_FIELDS = new Set([
  'section',
  'slug',
  'titleRu',
  'titleEn',
  'contentRu',
  'contentEn',
  'date',
  'cardImage'
]);

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function isValidCardImage(value) {
  if (!value) {
    return true;
  }

  if (value.startsWith('/uploads/')) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateKnownFields(payload) {
  const unknownFields = Object.keys(payload || {}).filter((field) => !ALLOWED_ARTICLE_FIELDS.has(field));
  if (unknownFields.length) {
    return `Unknown fields: ${unknownFields.join(', ')}`;
  }

  return '';
}

function validateArticleInput(payload, { partial = false } = {}) {
  const fieldError = validateKnownFields(payload);
  if (fieldError) {
    return { error: fieldError };
  }

  const normalized = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'section')) {
    const section = trimString(payload.section);
    if (!section) {
      return { error: 'Field section is required' };
    }
    if (!allowedSections.has(section)) {
      return { error: 'Invalid section value' };
    }
    normalized.section = section;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'slug')) {
    const slug = trimString(payload.slug).toLowerCase();
    if (!slug) {
      return { error: 'Field slug is required' };
    }
    if (!isValidSlug(slug) || slug.length < 3 || slug.length > 120) {
      return { error: 'Invalid slug format' };
    }
    normalized.slug = slug;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'titleRu')) {
    const titleRu = trimString(payload.titleRu);
    if (!titleRu) {
      return { error: 'Field titleRu is required' };
    }
    if (titleRu.length > 200) {
      return { error: 'Field titleRu is too long (max 200 chars)' };
    }
    normalized.titleRu = titleRu;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'titleEn')) {
    const titleEn = trimString(payload.titleEn);
    if (!titleEn) {
      return { error: 'Field titleEn is required' };
    }
    if (titleEn.length > 200) {
      return { error: 'Field titleEn is too long (max 200 chars)' };
    }
    normalized.titleEn = titleEn;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'contentRu')) {
    const contentRu = trimString(payload.contentRu);
    if (!contentRu) {
      return { error: 'Field contentRu is required' };
    }
    if (contentRu.length > 200000) {
      return { error: 'Field contentRu is too long' };
    }
    normalized.contentRu = contentRu;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'contentEn')) {
    const contentEn = trimString(payload.contentEn);
    if (!contentEn) {
      return { error: 'Field contentEn is required' };
    }
    if (contentEn.length > 200000) {
      return { error: 'Field contentEn is too long' };
    }
    normalized.contentEn = contentEn;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'date')) {
    const date = trimString(payload.date);
    if (!date) {
      return { error: 'Field date is required' };
    }
    if (!isValidDate(date)) {
      return { error: 'Invalid date format, expected YYYY-MM-DD' };
    }
    normalized.date = date;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'cardImage')) {
    const cardImage = trimString(payload.cardImage);
    if (!isValidCardImage(cardImage)) {
      return { error: 'Invalid cardImage URL' };
    }
    normalized.cardImage = cardImage;
  }

  if (partial && Object.keys(normalized).length === 0) {
    return { error: 'No valid fields provided for update' };
  }

  return { value: normalized };
}

function parseArticleId(value) {
  const articleId = Number.parseInt(value, 10);
  if (!Number.isInteger(articleId) || articleId <= 0) {
    return null;
  }

  return articleId;
}

// Gets all articles, optionally filtered by section
router.get('/', async (req, res) => {
  try {
    const articles = await readArticles();
    const section = trimString(req.query.section);

    if (section) {
      if (!allowedSections.has(section)) {
        return res.status(400).json({ error: 'Invalid section filter' });
      }

      const filtered = articles.filter((article) => article.section === section);
      return res.json(filtered);
    }

    return res.json(articles);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Gets a single article by ID
router.get('/:id', async (req, res) => {
  try {
    const articleId = parseArticleId(req.params.id);
    if (!articleId) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const articles = await readArticles();
    const article = articles.find((item) => item.id === articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    return res.json(article);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Creates a new article
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const validation = validateArticleInput(req.body, { partial: false });
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const articleData = validation.value;

    const result = await withArticlesLock(async () => {
      const articles = await readArticles();
      const exists = articles.some((article) => article.section === articleData.section && article.slug === articleData.slug);

      if (exists) {
        return {
          status: 400,
          payload: { error: 'Slug already exists in this section' },
          changed: false
        };
      }

      const newArticle = {
        id: getNextArticleId(articles),
        ...articleData
      };

      articles.push(newArticle);
      await saveArticles(articles);

      return {
        status: 201,
        payload: newArticle,
        changed: true
      };
    });

    if (result.changed) {
      scheduleSearchIndexRebuild();
    }

    return res.status(result.status).json(result.payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Updates an existing article by ID
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const articleId = parseArticleId(req.params.id);
    if (!articleId) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const validation = validateArticleInput(req.body, { partial: true });
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const patch = validation.value;

    const result = await withArticlesLock(async () => {
      const articles = await readArticles();
      const index = articles.findIndex((article) => article.id === articleId);

      if (index === -1) {
        return {
          status: 404,
          payload: { error: 'Article not found' },
          changed: false
        };
      }

      const current = articles[index];
      const nextSection = Object.prototype.hasOwnProperty.call(patch, 'section') ? patch.section : current.section;
      const nextSlug = Object.prototype.hasOwnProperty.call(patch, 'slug') ? patch.slug : current.slug;
      const duplicate = articles.some((article, articleIndex) => (
        articleIndex !== index && article.section === nextSection && article.slug === nextSlug
      ));

      if (duplicate) {
        return {
          status: 400,
          payload: { error: 'Slug already exists in this section' },
          changed: false
        };
      }

      articles[index] = { ...current, ...patch };
      await saveArticles(articles);

      return {
        status: 200,
        payload: articles[index],
        changed: true
      };
    });

    if (result.changed) {
      scheduleSearchIndexRebuild();
    }

    return res.status(result.status).json(result.payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Deletes an article by ID
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const articleId = parseArticleId(req.params.id);
    if (!articleId) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const result = await withArticlesLock(async () => {
      const articles = await readArticles();
      const index = articles.findIndex((article) => article.id === articleId);

      if (index === -1) {
        return {
          status: 404,
          payload: { error: 'Article not found' },
          changed: false
        };
      }

      const [deletedArticle] = articles.splice(index, 1);
      await saveArticles(articles);

      return {
        status: 200,
        payload: deletedArticle,
        changed: true
      };
    });

    if (result.changed) {
      scheduleSearchIndexRebuild();
    }

    return res.status(result.status).json(result.payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
