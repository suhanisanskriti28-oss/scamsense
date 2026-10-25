// src/services/extractor.js
/**
 * Deterministic entity extraction for an offer text.
 * Returns an object containing arrays of detected emails, phone numbers,
 * URLs, monetary amounts and a best‑guess company name (if any).
 * No external APIs – pure regex, fast and safe.
 */
export const extractEntities = (text) => {
  if (typeof text !== "string") return {};

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g;
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
  const amountRegex = /\b(?:\$|₹|£|€)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g;
  const companyRegex = /(?:[A-Z][a-zA-Z0-9&]+(?:\s+[A-Z][a-zA-Z0-9&]+)*)/g;

  const emails = [...new Set(text.match(emailRegex) || [])];
  const phones = [...new Set(text.match(phoneRegex) || [])];
  const urls = [...new Set(text.match(urlRegex) || [])];
  const amounts = [...new Set(text.match(amountRegex) || [])];

  // Simple heuristic for company name: first capitalised phrase of 2+ words not matching other entities
  let company = null;
  const candidates = (text.match(companyRegex) || []).filter((c) => c.split(/\s+/).length > 1);
  if (candidates.length) {
    company = candidates.find((c) => !c.includes("@") && !c.startsWith("http")) || candidates[0];
  }

  return {
    emails,
    phones,
    urls,
    amounts,
    company,
  };
};
