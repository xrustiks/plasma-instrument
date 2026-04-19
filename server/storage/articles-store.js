import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_FILE = path.join(__dirname, 'data', 'articles.json');
let articlesMutationQueue = Promise.resolve();

// Provides atomic file writes by writing to a temp file and renaming it
async function atomicWriteFile(filePath, content) {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const tempFilePath = path.join(
    directory,
    `.${baseName}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  );

  // Write to a temp file in the same directory so rename stays atomic.
  await fs.writeFile(tempFilePath, content, 'utf-8');

  // Replace the target file in one operation.
  await fs.rename(tempFilePath, filePath);
}

// Ensures that article mutations (create, update, delete) are executed sequentially
export function withArticlesLock(task) {
  const next = articlesMutationQueue.then(task);

  // Keep queue alive after errors so next tasks can still execute.
  articlesMutationQueue = next.catch(() => {});
  return next;
}

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
  await atomicWriteFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

// Generates the next unique article ID based on the existing articles
export function getNextArticleId(articles) {
  if (articles.length === 0) {
    return 1;
  }

  return Math.max(...articles.map((article) => article.id)) + 1;
}