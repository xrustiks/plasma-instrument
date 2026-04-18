import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');

// Provides functions to read, write, and manage articles stored in a JSON file
export async function readArticles() {
  try {
    const data = await fs.readFile(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Saves the given array of articles to the JSON file, creating directories if necessary
export async function saveArticles(articles) {
  await fs.mkdir(path.dirname(ARTICLES_FILE), { recursive: true });
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

// Generates the next unique article ID based on the existing articles
export function getNextArticleId(articles) {
  if (articles.length === 0) {
    return 1;
  }

  return Math.max(...articles.map((article) => article.id)) + 1;
}