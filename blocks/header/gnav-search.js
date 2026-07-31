import { createOptimizedPicture } from "../../scripts/aem.js";
import { fetchPlaceholders } from "../../scripts/placeholders.js";

const SEARCH_ICON = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false">
  <path d="M14 2A8 8 0 0 0 7.4 14.5L2.4 19.4a1.5 1.5 0 0 0 2.1 2.1L9.5 16.6A8 8 0 1 0 14 2Zm0 14.1A6.1 6.1 0 1 1 20.1 10 6.1 6.1 0 0 1 14 16.1Z"></path>
</svg>`;

let indexCache = null;

/**
 * Fetch and cache the query-index data used as the search corpus.
 * @param {string} source URL of the query-index.json feed
 * @returns {Promise<Array>} the index records
 */
async function fetchIndex(source) {
  if (indexCache) return indexCache;
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    indexCache = json.data || [];
  } catch (e) {
    indexCache = [];
  }
  return indexCache;
}

/**
 * Rank and filter records against the search terms. Title matches rank
 * above description/path matches, and each group is sorted by match position.
 */
function filterData(searchTerms, data) {
  const inTitle = [];
  const inMeta = [];

  data.forEach((result) => {
    const title = (result.title || "").toLowerCase();
    let minIdx = -1;
    searchTerms.forEach((term) => {
      const idx = title.indexOf(term);
      if (idx < 0) return;
      if (minIdx < 0 || idx < minIdx) minIdx = idx;
    });
    if (minIdx >= 0) {
      inTitle.push({ minIdx, result });
      return;
    }

    const meta =
      `${result.title || ""} ${result.description || ""} ${result.path.split("/").pop()} ${result.tags.split(",").pop()}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = meta.indexOf(term);
      if (idx < 0) return;
      if (minIdx < 0 || idx < minIdx) minIdx = idx;
    });
    if (minIdx >= 0) inMeta.push({ minIdx, result });
  });

  const byIdx = (a, b) => a.minIdx - b.minIdx;
  return [...inTitle.sort(byIdx), ...inMeta.sort(byIdx)].map((i) => i.result);
}

/**
 * Wrap occurrences of the search terms in <mark> for a given text string,
 * returning a document fragment to append.
 */
function highlight(text, terms) {
  const fragment = document.createDocumentFragment();
  if (!text) return fragment;
  const matches = [];
  terms.forEach((term) => {
    let start = 0;
    let idx = text.toLowerCase().indexOf(term, start);
    while (idx >= 0) {
      matches.push({ start: idx, end: idx + term.length });
      start = idx + term.length;
      idx = text.toLowerCase().indexOf(term, start);
    }
  });
  if (!matches.length) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }
  matches.sort((a, b) => a.start - b.start);
  let cursor = 0;
  matches.forEach(({ start, end }) => {
    if (start < cursor) return;
    if (start > cursor) {
      fragment.appendChild(
        document.createTextNode(text.substring(cursor, start)),
      );
    }
    const mark = document.createElement("mark");
    mark.className = "gnav-search-highlight";
    mark.textContent = text.substring(start, end);
    fragment.appendChild(mark);
    cursor = end;
  });
  if (cursor < text.length)
    fragment.appendChild(document.createTextNode(text.substring(cursor)));
  return fragment;
}

/**
 * Format an epoch-day or unix-seconds date value into MM-DD-YYYY.
 */
function formatDate(value) {
  if (!value) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  // helix query-index stores dates as days since 1899-12-30 (spreadsheet epoch)
  const ms = num < 100000 ? (num - 25569) * 86400000 : num * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getFullYear()}`;
}

/**
 * Build a single result list item as an article card.
 */
function renderResult(result, terms) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.className = "article-card";
  a.href = result.path;

  if (result.image) {
    const imageWrap = document.createElement("div");
    imageWrap.className = "article-card-image";
    imageWrap.append(
      createOptimizedPicture(result.image, result.imageAlt || "", false, [
        { width: "750" },
      ]),
    );
    a.append(imageWrap);
  }

  const body = document.createElement("div");
  body.className = "article-card-body";

  const category = Array.isArray(result.tags) ? result.tags[0] : result.tags;
  if (category) {
    const cat = document.createElement("p");
    cat.className = "article-card-category";
    const catLink = document.createElement("a");
    catLink.textContent = category;
    cat.append(catLink);
    body.append(cat);
  }

  const h3 = document.createElement("h3");
  h3.append(highlight(result.title || "", terms));
  body.append(h3);

  if (result.description) {
    const desc = document.createElement("p");
    desc.className = "article-card-description";
    desc.append(highlight(result.description, terms));
    body.append(desc);
  }

  const date = formatDate(result.date);
  if (date) {
    const dateEl = document.createElement("p");
    dateEl.className = "article-card-date";
    dateEl.textContent = date;
    body.append(dateEl);
  }

  a.append(body);
  li.append(a);
  return li;
}

/**
 * Run a search and render its results into the results list.
 */
async function runSearch(value, els, config) {
  const { resultsList } = els;
  resultsList.innerHTML = "";
  const query = value.trim().toLowerCase();
  if (query.length < 3) {
    els.input.classList.remove("gnav-search-input--isPopulated");
    return;
  }
  els.input.classList.add("gnav-search-input--isPopulated");

  const terms = query.split(/\s+/).filter(Boolean);
  const data = await fetchIndex(config.source);
  const results = filterData(terms, data);

  if (!results.length) {
    const li = document.createElement("li");
    li.className = "gnav-search-no-results";
    li.textContent = config.noResults;
    resultsList.append(li);
    return;
  }
  results.forEach((result) => resultsList.append(renderResult(result, terms)));
}

/**
 * Open or close the search bar.
 */
function toggleSearch(els, force) {
  const { container, button, input } = els;
  const willOpen =
    force !== undefined ? force : !container.classList.contains("is-open");
  container.classList.toggle("is-open", willOpen);
  button.setAttribute("aria-expanded", willOpen ? "true" : "false");
  button.setAttribute("aria-label", willOpen ? "Close" : "Search");
  if (willOpen) {
    input.focus();
  } else {
    input.value = "";
    els.resultsList.innerHTML = "";
  }
}

/**
 * Build the gnav-search component and wire up its behavior.
 * @param {string} source URL of the query-index feed to search against
 * @returns {Promise<HTMLElement>} the search container element
 */
export default async function buildGnavSearch(source) {
  const placeholders = await fetchPlaceholders();
  const config = {
    source: source || `${window.hlx.codeBasePath}/query-index.json`,
    placeholder: placeholders.searchPlaceholder || "Search",
    noResults: placeholders.searchNoResults || "No results found.",
  };

  const container = document.createElement("div");
  container.className = "gnav-search";

  const button = document.createElement("button");
  button.className = "gnav-search-button";
  button.setAttribute("aria-label", "Search");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "gnav-search-bar");
  button.innerHTML = SEARCH_ICON;

  const bar = document.createElement("aside");
  bar.id = "gnav-search-bar";
  bar.className = "gnav-search-bar";

  const field = document.createElement("div");
  field.className = "gnav-search-field";
  field.innerHTML = SEARCH_ICON;

  const input = document.createElement("input");
  input.className = "gnav-search-input";
  input.placeholder = config.placeholder;
  input.setAttribute("aria-label", config.placeholder);
  field.append(input);

  const resultsWrap = document.createElement("div");
  resultsWrap.className = "gnav-search-results";
  const resultsList = document.createElement("ul");
  resultsWrap.append(resultsList);

  bar.append(field, resultsWrap);
  container.append(button, bar);

  const els = {
    container,
    button,
    input,
    resultsList,
  };

  button.addEventListener("click", () => toggleSearch(els));
  input.addEventListener("input", (e) =>
    runSearch(e.target.value, els, config),
  );
  input.addEventListener("keyup", (e) => {
    if (e.code === "Escape") toggleSearch(els, false);
  });
  document.addEventListener("click", (e) => {
    if (
      container.classList.contains("is-open") &&
      !container.contains(e.target)
    ) {
      toggleSearch(els, false);
    }
  });

  return container;
}
