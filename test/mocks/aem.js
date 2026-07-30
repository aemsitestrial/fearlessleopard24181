export function createOptimizedPicture(src, alt = '', eager = false) {
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = eager ? 'eager' : 'lazy';
  picture.append(img);
  return picture;
}

export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
}

export function getMetadata(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content ?? '';
}

export function decorateIcons() {}
export function decorateButtons() {}
export function decorateBlock() {}
export function loadBlock() {}
export function loadScript() {}
export function loadStyle() {}
export function sampleRUM() {}
export function fetchPlaceholders() {
  return Promise.resolve({});
}
