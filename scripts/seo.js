import { SITE_STATES, SITE_LOCALES } from './constants.js';

/**
 * Structured data (schema.org JSON-LD).
 *
 * We only emit an organisation/business entity on a state *home* page (e.g.
 * `/tx/` or `/tx/fr/`), which is the natural landing page for the brand. The
 * payload is assembled exclusively from data already authored on the page —
 * the brand name from the header logo, the canonical URL, the social image and
 * the meta description — so it can never drift out of sync with the content and
 * never fabricates facts (address, phone, hours) that were not authored.
 */

/**
 * True when the current path is a state home page: `/{state}` or
 * `/{state}/{locale}` with nothing after it.
 * @returns {boolean}
 */
function isStateHome() {
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (!SITE_STATES.includes(segs[0])) return false;
  if (segs.length === 1) return true;
  return segs.length === 2 && SITE_LOCALES.includes(segs[1]);
}

/**
 * Read the brand name from the header logo (its image alt text, falling back to
 * the link's accessible label). Returns '' when the header has not rendered a
 * brand, so callers can skip emitting a nameless entity.
 * @returns {string}
 */
function getBrandName() {
  const brandLink = document.querySelector('.nav-brand a');
  if (!brandLink) return '';
  const img = brandLink.querySelector('img');
  return (img?.getAttribute('alt') || brandLink.textContent || '').trim();
}

function metaContent(selector) {
  return document.head.querySelector(selector)?.getAttribute('content') || '';
}

/**
 * Build and inject the JSON-LD script tag for the current state home page.
 * No-op on any other page, when one is already present, or when the brand name
 * cannot be resolved.
 */
export default function injectStructuredData() {
  if (!isStateHome()) return;
  if (document.head.querySelector('script[type="application/ld+json"]')) return;

  const name = getBrandName();
  if (!name) return;

  const url = document.querySelector('link[rel="canonical"]')?.href
    || window.location.href;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name,
    url,
  };

  const image = metaContent('meta[property="og:image"]');
  if (image) data.image = image;
  const description = metaContent('meta[name="description"]');
  if (description) data.description = description;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}
