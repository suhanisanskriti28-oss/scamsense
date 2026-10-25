// src/services/signals.js
/**
 * Deterministic signal engine for ScamSense.
 * Each signal returns an object { id, severity, weight, matchedText, explanation }
 * when its condition is met, otherwise null.
 */
import { extractEntities } from "./extractor.js";

// Helper lists
const FREE_MAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "aol.com",
];
const SHORT_URL_DOMAINS = ["bit.ly", "tinyurl.com", "t.ly", "goo.gl", "ow.ly", "buff.ly"];

// ----- Signal definitions -----
const signals = [];

// 1. Fee / payment request
signals.push((text, entities) => {
  const feeKeywords = /\b(?:fee|payment|registration fee|upfront|pay|transfer|upi|crypto|bitcoin|account number)\b/i;
  const match = text.match(feeKeywords);
  if (match) {
    return {
      id: "fee-request",
      severity: 1,
      weight: 20,
      matchedText: match[0],
      explanation: "Message asks for a fee or payment up‑front, a classic scam indicator.",
    };
  }
  return null;
});

// 2. Urgency / pressure
signals.push((text) => {
  const urgencyKeywords = /\b(?:immediately|asap|urgent|limited time|act now|reply fast)\b/i;
  const match = text.match(urgencyKeywords);
  if (match) {
    return {
      id: "urgency",
      severity: 1,
      weight: 10,
      matchedText: match[0],
      explanation: "Creates pressure to act quickly – a typical scam tactic.",
    };
  }
  return null;
});

// 3. Free‑mail sender domain
signals.push((_, entities) => {
  if (!entities.emails?.length) return null;
  const freeMails = entities.emails.filter((e) => {
    const domain = e.split("@")[1]?.toLowerCase();
    return FREE_MAIL_DOMAINS.includes(domain);
  });
  if (freeMails.length) {
    return {
      id: "free-mail",
      severity: 1,
      weight: 15,
      matchedText: freeMails.join(", "),
      explanation: "Sender uses a free‑mail service rather than a corporate domain.",
    };
  }
  return null;
});

// 4. WhatsApp/Telegram‑only contact
signals.push((text, entities) => {
  const hasWhatsApp = /whatsapp/i.test(text);
  const hasTelegram = /telegram/i.test(text);
  const hasPhoneOrEmail = (entities.phones?.length || entities.emails?.length) > 0;
  if ((hasWhatsApp || hasTelegram) && !hasPhoneOrEmail) {
    return {
      id: "whatsapp-only",
      severity: 1,
      weight: 10,
      matchedText: hasWhatsApp ? "WhatsApp" : "Telegram",
      explanation: "Contact limited to messaging apps without a professional email/phone.",
    };
  }
  return null;
});

// 5. Guaranteed selection / no interview
signals.push((text) => {
  const guaranteeKeywords = /\b(?:no interview|guaranteed selection|you are selected|selected instantly)\b/i;
  const match = text.match(guaranteeKeywords);
  if (match) {
    return {
      id: "guaranteed-selection",
      severity: 1,
      weight: 20,
      matchedText: match[0],
      explanation: "Claims the applicant is already selected without an interview.",
    };
  }
  return null;
});

// 6. Suspicious or shortened URL
signals.push((_, entities) => {
  if (!entities.urls?.length) return null;
  const suspicious = entities.urls.filter((u) => {
    try {
      const hostname = new URL(u).hostname.toLowerCase();
      return SHORT_URL_DOMAINS.some((short) => hostname.includes(short));
    } catch {
      return false;
    }
  });
  if (suspicious.length) {
    return {
      id: "short-url",
      severity: 1,
      weight: 15,
      matchedText: suspicious.join(", "),
      explanation: "Contains known URL shorteners which hide the final destination.",
    };
  }
  return null;
});

// 7. Sender‑domain vs company mismatch
signals.push((_, entities) => {
  if (!entities.emails?.length || !entities.company) return null;
  const emailDomain = entities.emails[0].split("@")[1].toLowerCase();
  const companyTokens = entities.company.toLowerCase().split(/\s+/);
  const matches = companyTokens.some((t) => emailDomain.includes(t));
  if (!matches) {
    return {
      id: "domain-mismatch",
      severity: 1,
      weight: 15,
      matchedText: `${entities.emails[0]} (domain) vs ${entities.company}`,
      explanation: "Email domain does not match the claimed company name.",
    };
  }
  return null;
});

// 8. Unrealistic salary / amount
signals.push((text, entities) => {
  if (!entities.amounts?.length) return null;
  const highAmounts = entities.amounts.filter((amt) => {
    // Strip non‑digits and parse number
    const num = Number(amt.replace(/[^0-9]/g, ""));
    return num > 100000; // arbitrary threshold for unrealistic figure
  });
  if (highAmounts.length) {
    return {
      id: "unrealistic-amount",
      severity: 1,
      weight: 10,
      matchedText: highAmounts.join(", "),
      explanation: "Mentions a payment amount that is unusually large for an entry‑level role.",
    };
  }
  return null;
});

/**
 * Evaluate a raw offer text and return a risk assessment.
 * @param {string} rawText – the offer message.
 * @returns {{ score: number, riskLevel: string, evidence: Array }}
 */
export const evaluateOffer = (rawText) => {
  const entities = extractEntities(rawText);
  const evidence = [];
  let score = 0;

  for (const signalFn of signals) {
    const result = signalFn(rawText, entities);
    if (result) {
      evidence.push(result);
      score += result.weight * result.severity;
    }
  }

  // Cap score to 100
  score = Math.min(100, score);

  const riskLevel =
    score < 34 ? "Low" : score < 67 ? "Medium" : "High";

  return { score, riskLevel, evidence, entities };
};

export default evaluateOffer;
