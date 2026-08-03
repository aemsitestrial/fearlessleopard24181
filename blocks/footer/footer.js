import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getLangRoot } from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const langRoot = getLangRoot();

  // load footer as fragment
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : '/footer';
  if (langRoot && !footerPath.startsWith(`${langRoot}/`)) {
    footerPath = `${langRoot}${footerPath}`;
  }
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // append state selector
  const stateSel = document.createElement('div');
  stateSel.className = 'block state-selector';
  stateSel.setAttribute('data-block-name', 'state-selector');
  footer.append(stateSel);
  await loadCSS(`${window.hlx.codeBasePath}/blocks/state-selector/state-selector.css`);
  const { default: decorateStateSelector } = await import('../state-selector/state-selector.js');
  decorateStateSelector(stateSel);

  // append language selector
  const langSel = document.createElement('div');
  langSel.className = 'block lang-selector';
  langSel.setAttribute('data-block-name', 'lang-selector');
  footer.append(langSel);
  await loadCSS(`${window.hlx.codeBasePath}/blocks/lang-selector/lang-selector.css`);
  const { default: decorateLangSelector } = await import('../lang-selector/lang-selector.js');
  decorateLangSelector(langSel);

  block.append(footer);
}
