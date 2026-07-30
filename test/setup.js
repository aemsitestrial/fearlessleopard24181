// Prevent happy-dom from making real network requests during tests.
window.fetch = () => Promise.resolve({
  ok: true,
  status: 200,
  text: () => Promise.resolve(''),
  json: () => Promise.resolve({}),
});

// happy-dom 15 does not support :scope with child combinators (e.g. ':scope > div').
// This polyfill swaps :scope for a temporary attribute selector so queries resolve.
let counter = 0;
const original = Element.prototype.querySelector;

Element.prototype.querySelector = function scopeQuerySelectorPolyfill(
  selector,
) {
  if (!selector.includes(':scope')) {
    return original.call(this, selector);
  }
  counter += 1;
  const attr = `data-qs${counter}`;
  this.setAttribute(attr, '');
  const adjusted = selector.replace(/:scope/g, `[${attr}]`);
  let result = null;
  try {
    result = original.call(document, adjusted);
  } finally {
    this.removeAttribute(attr);
  }
  return result;
};
