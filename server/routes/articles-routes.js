import { Router } from 'express';
import {
  getNextArticleId,
  readArticles,
  saveArticles
} from '../data/articles-store.js';

const router = Router();

// Gets all articles, optionally filtered by section
router.get('/', async (req, res) => {
  try {
    const articles = await readArticles();
    const { section } = req.query;

    if (section) {
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
    const articleId = Number.parseInt(req.params.id, 10);
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
router.post('/', async (req, res) => {
  try {
    const { section, slug, titleRu, titleEn, contentRu, contentEn, date } = req.body;

    if (!section || !slug || !titleRu || !titleEn || !contentRu || !contentEn || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const articles = await readArticles();
    const exists = articles.some((article) => article.section === section && article.slug === slug);

    if (exists) {
      return res.status(400).json({ error: 'Slug already exists in this section' });
    }

    const newArticle = {
      id: getNextArticleId(articles),
      section,
      slug,
      titleRu,
      titleEn,
      contentRu,
      contentEn,
      date
    };

    articles.push(newArticle);
    await saveArticles(articles);

    return res.status(201).json(newArticle);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Updates an existing article by ID
router.put('/:id', async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const articles = await readArticles();
    const index = articles.findIndex((article) => article.id === articleId);

    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }

    articles[index] = { ...articles[index], ...req.body };
    await saveArticles(articles);

    return res.json(articles[index]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Deletes an article by ID
router.delete('/:id', async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const articles = await readArticles();
    const index = articles.findIndex((article) => article.id === articleId);

    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const [deletedArticle] = articles.splice(index, 1);
    await saveArticles(articles);

    return res.json(deletedArticle);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
