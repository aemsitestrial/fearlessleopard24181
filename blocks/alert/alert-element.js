import { loadCSS } from '../../scripts/aem.js';

const SHOELACE_CDN = 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn';

export default async function loadLibrary() {
  if (customElements.get('sl-alert')) return;

  loadCSS(`${SHOELACE_CDN}/themes/light.css`);

  // eslint-disable-next-line import/no-unresolved
  const [{ setBasePath }] = await Promise.all([
    import(`${SHOELACE_CDN}/utilities/base-path.js`),
    import(`${SHOELACE_CDN}/components/alert/alert.js`),
    import(`${SHOELACE_CDN}/components/icon/icon.js`),
  ]);

  setBasePath(SHOELACE_CDN);
}
