// src/services/domainIntel.js
/**
 * Domain intelligence utilities used by the signal engine.
 * - MX record lookup (to see if the domain has mail servers – a basic legitimacy check).
 * - Domain age via RDAP (registry data) with a 4‑second timeout.
 * All functions fail gracefully – they never throw to the caller; instead they
 * return `null` or a descriptive string, ensuring the API never crashes.
 */
import dns from "dns";

// Helper: timeout a promise (used for fetch)
const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

/**
 * Resolve MX records for a hostname.
 * @param {string} hostname – domain name (e.g., "example.com")
 * @returns {Promise<Array<string>|null>} Array of MX hostnames or `null` if lookup fails.
 */
export const getMxRecords = async (hostname) => {
  try {
    const records = await dns.promises.resolveMx(hostname);
    // Return just the exchange hostnames sorted by priority
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange);
  } catch (e) {
    // Any DNS error (NXDOMAIN, SERVFAIL, etc.) → graceful fallback
    return null;
  }
};

/**
 * Retrieve domain creation date via RDAP.
 * Uses the public https://rdap.org service. The request is aborted after 4 s.
 * @param {string} hostname – domain name (no protocol, e.g., "example.com")
 * @returns {Promise<string|null>} ISO date string of domain creation or `null`.
 */
export const getDomainAge = async (hostname) => {
  const url = `https://rdap.org/domain/${hostname}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    // RDAP spec: events array with "eventAction": "registration"
    const creationEvent = (data.events || []).find((e) => e.eventAction === "registration");
    return creationEvent?.eventDate ?? null;
  } catch (e) {
    // Network error, abort, JSON parse error → return null
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export default { getMxRecords, getDomainAge };
