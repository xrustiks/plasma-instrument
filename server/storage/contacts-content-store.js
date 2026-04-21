import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTACTS_CONTENT_FILE = path.join(__dirname, 'data', 'contacts-content.json');

const DEFAULT_CONTACTS_CONTENT = {
  phoneRaw: '+79600851803',
  phoneDisplay: '+7 (960) 085-18-03',
  email: 'info@plasma-instrument.com',
  addressRuFull: '420087, Республика Татарстан, г. Казань, ул. Даурская, 41, оф. 7',
  addressEnFull: '420087, Republic of Tatarstan, Kazan, Daurskaya 41, office 7',
  addressRuShort: 'Казань, ул. Даурская, 41, оф. 7',
  addressEnShort: 'Kazan, Daurskaya 41, office 7',
  contactsLeadRu: 'Готовы обсудить проект, модернизацию оборудования и подготовку технического решения под вашу задачу.',
  contactsLeadEn: 'Ready to discuss your project, equipment modernization, and a technical solution tailored to your task.',
  workingHoursRu: 'Понедельник - Пятница, 09:00 - 18:00',
  workingHoursEn: 'Monday - Friday, 09:00 - 18:00',
  workingHoursRuShort: 'Пн - Пт: 09:00 - 18:00',
  workingHoursEnShort: 'Mon - Fri: 09:00 - 18:00',
  responseTimeRu: 'Ответ в рабочее время',
  responseTimeEn: 'Response during business hours'
};

let contactsContentMutationQueue = Promise.resolve();

function cloneDefaultContactsContent() {
  return JSON.parse(JSON.stringify(DEFAULT_CONTACTS_CONTENT));
}

function normalizeContactsContent(payload) {
  const fallback = cloneDefaultContactsContent();
  const next = payload && typeof payload === 'object' ? payload : {};

  return {
    phoneRaw: typeof next.phoneRaw === 'string' ? next.phoneRaw : fallback.phoneRaw,
    phoneDisplay: typeof next.phoneDisplay === 'string' ? next.phoneDisplay : fallback.phoneDisplay,
    email: typeof next.email === 'string' ? next.email : fallback.email,
    addressRuFull: typeof next.addressRuFull === 'string' ? next.addressRuFull : fallback.addressRuFull,
    addressEnFull: typeof next.addressEnFull === 'string' ? next.addressEnFull : fallback.addressEnFull,
    addressRuShort: typeof next.addressRuShort === 'string' ? next.addressRuShort : fallback.addressRuShort,
    addressEnShort: typeof next.addressEnShort === 'string' ? next.addressEnShort : fallback.addressEnShort,
    contactsLeadRu: typeof next.contactsLeadRu === 'string' ? next.contactsLeadRu : fallback.contactsLeadRu,
    contactsLeadEn: typeof next.contactsLeadEn === 'string' ? next.contactsLeadEn : fallback.contactsLeadEn,
    workingHoursRu: typeof next.workingHoursRu === 'string' ? next.workingHoursRu : fallback.workingHoursRu,
    workingHoursEn: typeof next.workingHoursEn === 'string' ? next.workingHoursEn : fallback.workingHoursEn,
    workingHoursRuShort: typeof next.workingHoursRuShort === 'string' ? next.workingHoursRuShort : fallback.workingHoursRuShort,
    workingHoursEnShort: typeof next.workingHoursEnShort === 'string' ? next.workingHoursEnShort : fallback.workingHoursEnShort,
    responseTimeRu: typeof next.responseTimeRu === 'string' ? next.responseTimeRu : fallback.responseTimeRu,
    responseTimeEn: typeof next.responseTimeEn === 'string' ? next.responseTimeEn : fallback.responseTimeEn
  };
}

async function atomicWriteFile(filePath, content) {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const tempFilePath = path.join(
    directory,
    `.${baseName}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  );

  await fs.writeFile(tempFilePath, content, 'utf-8');
  await fs.rename(tempFilePath, filePath);
}

export function withContactsContentLock(task) {
  const next = contactsContentMutationQueue.then(task);
  contactsContentMutationQueue = next.catch(() => {});
  return next;
}

export async function readContactsContent() {
  try {
    const raw = await fs.readFile(CONTACTS_CONTENT_FILE, 'utf8');
    return normalizeContactsContent(JSON.parse(raw));
  } catch {
    return cloneDefaultContactsContent();
  }
}

export async function saveContactsContent(contactsContent) {
  await fs.mkdir(path.dirname(CONTACTS_CONTENT_FILE), { recursive: true });
  const normalized = normalizeContactsContent(contactsContent);
  await atomicWriteFile(CONTACTS_CONTENT_FILE, JSON.stringify(normalized, null, 2));
}
