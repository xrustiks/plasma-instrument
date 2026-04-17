import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_FILE = path.join(__dirname, 'articles.json');

export async function readArticles() {
  try {
    const data = await fs.readFile(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveArticles(articles) {
  await fs.mkdir(path.dirname(ARTICLES_FILE), { recursive: true });
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

export function getNextArticleId(articles) {
  if (articles.length === 0) {
    return 1;
  }

  return Math.max(...articles.map((article) => article.id)) + 1;
}
