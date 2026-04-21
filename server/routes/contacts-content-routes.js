import { Router } from 'express';
import {
  readContactsContent,
  saveContactsContent,
  withContactsContentLock
} from '../storage/contacts-content-store.js';
import { requireAdminAuth } from '../middleware/admin-basic-auth.js';

const router = Router();

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateEmail(value) {
  const email = trimString(value).toLowerCase();
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function normalizePhoneRaw(value) {
  const trimmed = trimString(value);
  if (!trimmed) return '';

  if (!/^\+?[0-9\s()-]+$/.test(trimmed)) {
    return '';
  }

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D+/g, '');
  if (!digits) return '';

  return `${hasPlus ? '+' : ''}${digits}`;
}

function validateContactsContent(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};

  const phoneRaw = normalizePhoneRaw(source.phoneRaw);
  const phoneDisplay = trimString(source.phoneDisplay);
  const email = validateEmail(source.email);

  const addressRuFull = trimString(source.addressRuFull);
  const addressEnFull = trimString(source.addressEnFull);
  const addressRuShort = trimString(source.addressRuShort);
  const addressEnShort = trimString(source.addressEnShort);
  const contactsLeadRu = trimString(source.contactsLeadRu);
  const contactsLeadEn = trimString(source.contactsLeadEn);
  const workingHoursRu = trimString(source.workingHoursRu);
  const workingHoursEn = trimString(source.workingHoursEn);
  const workingHoursRuShort = trimString(source.workingHoursRuShort);
  const workingHoursEnShort = trimString(source.workingHoursEnShort);
  const responseTimeRu = trimString(source.responseTimeRu);
  const responseTimeEn = trimString(source.responseTimeEn);

  if (!phoneRaw || !phoneDisplay) {
    return { error: 'Phone number is required' };
  }

  if (!email) {
    return { error: 'Email is invalid' };
  }

  if (!addressRuFull || !addressEnFull || !addressRuShort || !addressEnShort) {
    return { error: 'Address fields are required for both languages' };
  }

  if (!contactsLeadRu || !contactsLeadEn) {
    return { error: 'Contacts lead text is required for both languages' };
  }

  if (!workingHoursRu || !workingHoursEn || !workingHoursRuShort || !workingHoursEnShort) {
    return { error: 'Working hours fields are required for both languages' };
  }

  if (!responseTimeRu || !responseTimeEn) {
    return { error: 'Response time labels are required for both languages' };
  }

  return {
    value: {
      phoneRaw,
      phoneDisplay,
      email,
      addressRuFull,
      addressEnFull,
      addressRuShort,
      addressEnShort,
      contactsLeadRu,
      contactsLeadEn,
      workingHoursRu,
      workingHoursEn,
      workingHoursRuShort,
      workingHoursEnShort,
      responseTimeRu,
      responseTimeEn
    }
  };
}

router.get('/', async (req, res) => {
  try {
    const content = await readContactsContent();
    return res.json(content);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/', requireAdminAuth, async (req, res) => {
  try {
    const validation = validateContactsContent(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const payload = await withContactsContentLock(async () => {
      await saveContactsContent(validation.value);
      return readContactsContent();
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
