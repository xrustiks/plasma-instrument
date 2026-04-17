import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

// Middleware
app.use(cors());
app.use(express.json());

// Sections without Contacts
const SECTIONS = [
  { id: 'sources', labelRu: 'Источники', labelEn: 'Sources' },
  { id: 'services', labelRu: 'Услуги', labelEn: 'Services' },
  { id: 'projects', labelRu: 'Проекты', labelEn: 'Projects' },
  { id: 'blog', labelRu: 'Блог', labelEn: 'Blog' }
];

// Read articles from JSON file
async function readArticles() {
  try {
    const data = await fs.readFile(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save articles to JSON file
async function saveArticles(articles) {
  await fs.mkdir(path.dirname(ARTICLES_FILE), { recursive: true });
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

// Routes

// Get all sections
app.get('/api/sections', (req, res) => {
  res.json(SECTIONS);
});

// Get articles (optionally filtered by section)
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await readArticles();
    const section = req.query.section;
    
    if (section) {
      const filtered = articles.filter(a => a.section === section);
      return res.json(filtered);
    }
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const articles = await readArticles();
    const article = articles.find(a => a.id === parseInt(req.params.id));
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new article
app.post('/api/articles', async (req, res) => {
  try {
    const { section, slug, titleRu, titleEn, contentRu, contentEn, date } = req.body;
    
    // Validation
    if (!section || !slug || !titleRu || !titleEn || !contentRu || !contentEn || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const articles = await readArticles();
    
    // Check for duplicate slug in section
    const exists = articles.some(a => a.section === section && a.slug === slug);
    if (exists) {
      return res.status(400).json({ error: 'Slug already exists in this section' });
    }
    
    const newArticle = {
      id: articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1,
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
    
    res.status(201).json(newArticle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article
app.put('/api/articles/:id', async (req, res) => {
  try {
    const articles = await readArticles();
    const index = articles.findIndex(a => a.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    articles[index] = { ...articles[index], ...req.body };
    await saveArticles(articles);
    
    res.json(articles[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete article
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const articles = await readArticles();
    const index = articles.findIndex(a => a.id === parseInt(req.params.id));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const deleted = articles.splice(index, 1);
    await saveArticles(articles);
    
    res.json(deleted[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
async function main() {
  try {
    app.listen(PORT, () => {
      console.log(`✅ API server running on http://localhost:${PORT}`);
      console.log(`📝 Admin panel: http://localhost:8000/admin/`);
    });
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
}

main();
