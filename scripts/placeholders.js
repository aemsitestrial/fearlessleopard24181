import { toCamelCase } from './aem.js';

export default async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => (resp.ok ? resp.json() : {}))
        .then((json) => {
          const placeholders = {};
          (json.data || [])
            .filter((p) => p.Key)
            .forEach((p) => {
              placeholders[toCamelCase(p.Key)] = p.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(placeholders);
        })
        .catch(() => {
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[prefix];
}
