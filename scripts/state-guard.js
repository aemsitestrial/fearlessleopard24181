import { SITE_STATES, STORAGE_KEY } from './constants.js';

export default function enforceStateSelection() {
  const { pathname } = window.location;

  if (pathname.startsWith('/state-selector')) return false;

  const segments = pathname.split('/').filter(Boolean);
  if (!SITE_STATES.includes(segments[0])) return false;

  let savedState;
  try {
    savedState = localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }

  const returnPath = `/${segments.slice(1).join('/')}`;

  if (!SITE_STATES.includes(savedState)) {
    window.location.replace(`/state-selector?return=${encodeURIComponent(returnPath)}`);
    return true;
  }

  if (savedState !== segments[0]) {
    window.location.replace(`/${savedState}${returnPath}`);
    return true;
  }

  return false;
}
