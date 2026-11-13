import { t, getLanguage, setLanguage, resolveLanguage, rememberLanguage } from './i18n.js';
import { exhibitURL } from './routes.js';
import { getCollection } from './collection.js';
let { exhibits, sources, tours, categories } = getCollection();
import { illustration, cabinet } from './illustrations.js';
import { readNotebook, saveNotebook, normalizeSearch, parseRoute } from './state.js';
import { esc, icon, toast, announce } from './ui.js';
import { mountDemo } from './demos/index.js';

const main = document.getElementById('main');
const ids = exhibits.map(item => item.id);
const getExhibit = id => exhibits.find(item => item.id === id);
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
setLanguage(resolveLanguage(location.search, storage));
let notebook = readNotebook(storage, ids);
let filter = 'All';
let query = '';
let cleanup = () => {};
let initial = true;
let activeHash = location.hash;
const diagramDialog = document.getElementById('diagram-dialog');
let diagramUrl;
const scrollPositions = new Map();
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function saveButton(item, small = true) {
  const saved = notebook.saved.includes(item.id);
  return `<button class="${small ? 'save-object' : 'button secondary small'}" type="button" data-save="${item.id}" aria-label="${esc(item.title)}: ${saved ? t("remove from notebook") : t("add to notebook")}" aria-pressed="${saved}">${icon('star', 18)}${small ? '' : `<span>${saved ? t("Saved") : t("Save to notebook")}</span>`}</button>`;
}
function card(item, index = -1) {
  return `<article class="specimen ${index === 0 || index === 6 ? 'wide' : ''}" data-exhibit="${item.id}"><a href="${exhibitURL(item.id)}" class="card-link"><div class="art-field ${item.color}">${illustration(item.id, { decorative: true })}${notebook.visited.includes(item.id) ? `<span class="visited-dot">${icon('check', 12)} ${t("Visited")}</span>` : ''}</div><div class="label"><span class="era">${esc(item.date)}</span><h3>${item.title}</h3><p class="teaser">${item.teaser}</p><span class="card-open">${t("Explore the mechanism")} ${icon('arrow', 16)}</span></div></a>${saveButton(item)}</article>`;
}
function home() {
  return `<div class="wrap"><section class="hero" aria-labelledby="home-title"><div class="hero-copy"><div class="collection-note">${t("First selection · Nine curious inventions")}</div><h1 id="home-title">${t("Some ideas<br>are rather odd.")}</h1><p>${t("Listen with concrete. Scan a picture through holes. Store a pattern on cards.<br>Welcome to a cabinet of human ingenuity.")}</p><div class="hero-actions"><a class="button" href="#/collection">${t("Open the cabinet")} ${icon('arrow', 18)}</a><button class="text-button" type="button" data-random>${icon('shuffle', 16)} ${t("Surprise me")}</button></div></div><figure class="hero-figure">${cabinet(exhibits)}<figcaption><span>✧</span> ${t("Touch an object. Step inside an idea.")}</figcaption></figure></section><div class="manifesto"><p class="small-copy">${t("Some changed everyday life.<br>Some remained experiments.<br>Each holds a good question.")}</p><p>${t("No need to stay behind the glass.<br>Turn handles, punch cards, change the path of light.")}</p></div><section id="collection" aria-labelledby="collection-title"><div class="section-intro"><h2 id="collection-title">${t("What caught your curiosity?")}</h2><p>${t("Choose an object. Read its story, operate its mechanism and discover the limits of its idea.")}</p></div><div class="collection-toolbar"><div class="filters" role="group" aria-label="${t("Filter the collection by subject")}">${categories.map(category => `<button type="button" class="filter" data-filter="${category}" aria-pressed="${filter === category}">${t(category)}</button>`).join('')}</div><label class="search">${icon('search', 18)}<span class="sr-only">${t("Search the collection")}</span><input id="collection-search" type="search" placeholder="${t("An object, a material, an idea…")}" value="${esc(query)}" autocomplete="off"></label></div><div class="result-summary" id="result-summary" role="status" aria-live="polite"></div><div class="collection-grid" id="collection-grid"></div></section><section class="tour-section" id="tours" aria-labelledby="tour-title"><div class="section-intro"><h2 id="tour-title">${t("One curiosity opens another.")}</h2><p>${t("Three objects, one shared question.<br>A small route if you need a starting point.")}</p></div><div class="tour-grid">${tours.map(tour => `<article class="tour-card ${tour.color}"><h3>${tour.title}</h3><p>${tour.text}</p><div class="tour-objects" aria-hidden="true">${tour.ids.map(id => illustration(id, { decorative: true })).join('')}</div><a href="${exhibitURL(tour.ids[0], tour.id)}"><span class="tour-length">${t("3 stops")}</span>${t("Follow the route")} ${icon('arrow', 17)}</a></article>`).join('')}</div></section><section class="closing-note"><div><h3>${t("Curiosity has a back room too.")}</h3><p>${t("Where does each claim come from? What do we know, and what are we only modelling? The source book is open too.")}</p></div><a href="#/sources" class="button secondary">${t("Open the source book")} ${icon('book', 17)}</a></section></div>`;
}
function updateGallery() {
  const needle = normalizeSearch(query);
  const matches = exhibits.filter(item => (filter === 'All' || item.category === filter) && normalizeSearch([item.title, item.subtitle, item.teaser, item.material, item.place, item.date, item.category].join(' ')).includes(needle));
  const gallery = document.getElementById('collection-grid');
  if (!gallery) return;
  gallery.innerHTML = matches.length ? matches.map((item, index) => card(item, matches.length === 9 ? index : -1)).join('') : `<div class="empty-state"><h3>${t("Nothing in this drawer matched.")}</h3><p>${t("Try another word, or return to the complete collection.")}</p><button type="button" class="text-button" data-clear-search>${t("Clear search and filters")} ${icon('reset', 16)}</button></div>`;
  document.getElementById('result-summary').textContent = needle || filter !== 'All' ? t("Found {count} objects", { count: matches.length }) : t("Nine objects · All ready to explore");
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === filter));
}
function sourceIds(item) { return [...new Set([...item.sections.flatMap(section => section.refs), ...item.timeline.flatMap(event => event.refs)])]; }
function cite(refs, all) {
  return refs?.length ? `<span class="citations">${refs.map(id => `<a class="citation" href="${sources[id].url}" target="_blank" rel="noopener noreferrer" aria-label="${t("Source")} ${all.indexOf(id) + 1}: ${esc(sources[id].title)}">${all.indexOf(id) + 1}</a>`).join('')}</span>` : '';
}
function sourceList(refs) { return `<ol class="source-list">${refs.map(id => { const source = sources[id]; return `<li id="source-${id}"><span class="institution">${source.institution}</span><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a><p>${source.note}</p></li>`; }).join('')}</ol>`; }
function detail(item, tourId) {
  const refs = sourceIds(item);
  const tour = tours.find(candidate => candidate.id === tourId && candidate.ids.includes(item.id));
  const stop = tour?.ids.indexOf(item.id);
  const next = tour?.ids[stop + 1];
  const nextLink = next ? exhibitURL(next, tour.id) : '#/tours';
  return `<div class="wrap"><div class="breadcrumb"><a href="#/collection">${icon('back', 15)} ${t("Collection")}</a><span>${t(item.category)}</span><span>${item.title}</span></div>${tour ? `<div class="tour-progress"><span>${tour.title} · ${t("Stop {stop} of 3", { stop: stop + 1 })}</span><a href="${nextLink}">${next ? t("Next: {title}", { title: getExhibit(next).title }) : t("Route complete · Back to routes")} ${icon('arrow', 15)}</a></div>` : ''}<section class="object-hero"><div><div class="collection-note">${item.date}</div><h1>${item.title}</h1><p class="subtitle">${item.subtitle}</p><p class="intro">${item.intro}</p><div class="object-meta"><span>${t("Location / context")}<strong>${item.place}</strong></span><span>${t("Materials")}<strong>${item.material}</strong></span></div><div class="object-actions"><button class="button small" type="button" data-jump="experiment">${t("Try the mechanism")} ${icon('play', 16)}</button>${saveButton(item, false)}</div></div><div class="hero-illustration">${illustration(item.id)}</div></section><section class="lab" id="experiment" aria-labelledby="lab-title"><div class="lab-label">${t("Worktable · Explanatory model")}</div><h2 id="lab-title">${item.lab.title}</h2><p class="lab-instruction">${item.lab.instruction}</p><div id="demo-root" class="demo" data-demo="${item.id}"></div><p class="lab-observation">${item.lab.observation}</p><details class="model-notes"><summary>${t("What does this model show? Assumptions and mathematics")}</summary><p>${item.lab.model}</p><div class="equation">${item.lab.equation}</div></details></section><div class="reading-layout"><aside class="reading-sidebar" aria-label="${t("The object’s story")}"><p>${item.question}</p>${item.sections.map((section, i) => `<button class="text-button" type="button" data-jump="story-${i}">${section.title}</button>`).join('')}<button type="button" class="text-button" data-jump="object-sources">${t("View the sources")} ${icon('external', 14)}</button></aside><div class="story-body">${item.sections.map((section, i) => `<section class="story-section" id="story-${i}"><h2>${section.title}</h2>${section.paragraphs.map((paragraph, index) => `<p>${paragraph}${index === section.paragraphs.length - 1 ? cite(section.refs, refs) : ''}</p>`).join('')}</section>`).join('')}<section class="story-section"><h2>${t("Its place in time")}</h2><ol class="timeline">${item.timeline.map(event => `<li><strong>${event.date}</strong>${event.text}${cite(event.refs, refs)}</li>`).join('')}</ol></section><aside class="editorial-note"><strong>${t("A note beside the object")}</strong>${item.note}</aside><section class="story-section" id="object-sources"><h2>${t("Source book")}</h2>${sourceList(refs)}</section></div></div>${tour ? `<div class="tour-progress"><span>${stop === 2 ? t("Three objects, one question. You have reached the end of this route.") : t("Continue along {title}.", { title: tour.title })}</span><a href="${nextLink}">${next ? getExhibit(next).title : t("Choose another route")} ${icon('arrow', 16)}</a></div>` : ''}<section class="related"><h2>${t("This drawer opens onto these.")}</h2><div class="related-grid">${item.related.map(id => { const other = getExhibit(id); return `<a class="related-item" href="${exhibitURL(id)}">${illustration(id, { decorative: true })}<div><h3>${other.title}</h3><p>${other.subtitle}</p></div></a>`; }).join('')}</div></section></div>`;
}
function notebookPage() {
  const saved = notebook.saved.map(getExhibit);
  return `<div class="wrap"><div class="page-heading"><div class="collection-note">${t("Your own little collection")}</div><h1>${t("My notebook")}</h1><p>${t("If an object leaves you with a question, touch its star. Drawers worth returning to collect here. The notebook stays in this browser.")}</p></div><div class="notebook-summary"><p><strong>${notebook.visited.length} / 9</strong> ${t("objects visited")} · <strong>${saved.length}</strong> ${t("objects in your notebook")}</p><div class="control-buttons"><button type="button" class="button secondary small" data-export ${!notebook.visited.length && !saved.length ? 'disabled' : ''}>${icon('download', 16)} ${t("Download notebook")}</button><button type="button" class="text-button" data-clear-notebook ${!notebook.visited.length && !saved.length ? 'disabled' : ''}>${t("Clear notebook")}</button></div></div><div class="collection-grid">${saved.length ? saved.map(item => card(item)).join('') : `<div class="empty-state"><h3>${t("The first page is still empty.")}</h3><p>${t("Stars in the collection add objects to this notebook.")}</p><a class="button secondary small" href="#/collection" style="margin-top:22px">${t("Choose an object")} ${icon('arrow', 16)}</a></div>`}</div>${notebook.visited.length ? `<section class="notebook-visited"><h2>${t("Drawers you have visited")}</h2><div class="visited-list">${notebook.visited.map(id => `<a href="${exhibitURL(id)}">${getExhibit(id).title}</a>`).join('')}</div></section>` : ''}</div>`;
}
function sourcesPage() {
  return `<div class="wrap"><div class="page-heading"><div class="collection-note">${t("The cabinet’s back room")}</div><h1>${t("Source book")}</h1><p>${t("A museum record, a patent, a research paper. Every object’s story has evidence behind it. Below, we distinguish complete pages from accessible excerpts and abstracts.")}</p><span class="source-count">${t("{count} sources · Last checked: 13 November 2026", { count: Object.keys(sources).length })}</span></div><div class="source-book">${exhibits.map(item => `<section class="source-group"><h2><a href="${exhibitURL(item.id)}">${item.title}</a></h2>${sourceList(sourceIds(item))}</section>`).join('')}</div></div>`;
}
function aboutPage() {
  return `<div class="wrap"><div class="page-heading"><div class="collection-note">${t("About this cabinet")}</div><h1>${t("Feel free to explore.")}</h1><p>${t("Cabinet of Curiosities is a small digital museum exploring how people made ideas work, through nine historical objects.")}</p></div><div class="about-body"><h2>${t("Why these objects?")}</h2><p>${t("Some carry information, some light, some a movement. They share more than being old and unusual: each shows a different way of giving thought a physical form. A card makes a selection, a surface gathers sound, a gear holds a ratio.")}</p><h2>${t("Story, evidence, model")}</h2><p>${t("Historical narratives draw on museum and heritage records, original research and a patent. When dates or attributions differ, the exhibit note says so. The source book distinguishes full texts from indexed passages and abstracts.")}</p><p>${t("Each worktable is an explanatory model. Its assumptions and calculations are written in its panel. A working display does not mean every physical property of the historical apparatus has been verified.")}</p><h2>${t("Illustrations and sound")}</h2><p>${t("The object illustrations and experimental drawings are original to this cabinet. No museum photographs are used, and the drawings are not measured reconstructions. Theremin sound starts only when you enable it and stops when you leave the exhibit.")}</p><h2>${t("The traces you leave here")}</h2><p>${t("Your notebook and language preference stay in this browser. There are no accounts, tracking scripts or analytics. Download or clear your notebook whenever you like. Fonts and exhibit files load from the site itself.")}</p><h2>${t("Ways to explore")}</h2><ul><li>${t("Open an object from the cabinet or the collection.")}</li><li>${t("Follow a shared question along a three-stop route.")}</li><li>${t("Use the arrow keys on the sliders too.")}</li><li>${t("Run, pause or advance the mechanisms one step at a time.")}</li><li>${t("Download a harmonograph drawing as SVG or your notebook as JSON.")}</li></ul><p>${t("First selection prepared for Elmar Quliyev, November 2026.")}</p><a href="https://github.com/kulieff21/merak-kabinesi" class="button secondary small" target="_blank" rel="noopener noreferrer" style="margin-top:25px">${t("View the source code")} ${icon('external', 16)}</a></div></div>`;
}
function updateShell() {
  document.documentElement.lang = getLanguage();
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(element => { element.innerHTML = t(element.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-label]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nLabel)); });
  document.querySelectorAll('[data-i18n-content]').forEach(element => { element.setAttribute('content', t(element.dataset.i18nContent)); });
  document.getElementById('language').value = getLanguage();
}
function persist() { if (!saveNotebook(storage, notebook)) toast(t("The notebook is open for this session; this browser did not allow persistent storage.")); }
function updateSavedCount() {
  const count = document.getElementById('saved-count');
  count.textContent = notebook.saved.length; count.hidden = !notebook.saved.length;
}
function render() {
  ({ exhibits, sources, tours, categories } = getCollection(getLanguage()));
  updateShell();
  if (diagramDialog.open) diagramDialog.close();
  cleanup(); cleanup = () => {};
  const route = parseRoute(location.hash);
  const item = route.page === 'exhibit' && getExhibit(route.id);
  const isHome = ['home', 'collection', 'tours'].includes(route.page);
  if (item) {
    if (!notebook.visited.includes(item.id)) { notebook.visited.push(item.id); persist(); }
    main.innerHTML = detail(item, route.tour);
    document.title = `${item.title} — ${t("Cabinet of Curiosities")}`;
    try { cleanup = mountDemo(item.id, document.getElementById('demo-root')); }
    catch (error) { document.getElementById('demo-root').innerHTML = `<p>${t("The mechanism could not load. Refresh to try again; its story is still available below.")}</p>`; console.error(error); }
  } else if (isHome) {
    main.innerHTML = home(); updateGallery();
    document.title = t("Cabinet of Curiosities — Feel free to explore");
  } else if (route.page === 'notebook') { main.innerHTML = notebookPage(); document.title = t("My notebook — Cabinet of Curiosities"); }
  else if (route.page === 'sources') { main.innerHTML = sourcesPage(); document.title = t("Source book — Cabinet of Curiosities"); }
  else if (route.page === 'about') { main.innerHTML = aboutPage(); document.title = t("About — Cabinet of Curiosities"); }
  else { main.innerHTML = `<div class="wrap not-found"><h1>${t("This drawer is not here.")}</h1><p>${t("Choose another object from the collection.")}</p><a class="button" href="#/collection">${t("Back to the collection")}</a></div>`; document.title = t("Drawer not found — Cabinet of Curiosities"); }
  document.querySelectorAll('[data-nav]').forEach(link => {
    const selected = (link.dataset.nav === 'collection' && ((isHome && route.page !== 'tours') || item)) || (link.dataset.nav === 'notebook' && route.page === 'notebook') || (link.dataset.nav === 'sources' && route.page === 'sources') || (link.dataset.nav === 'tours' && route.page === 'tours');
    if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  updateSavedCount();
  if (!initial) { main.focus({ preventScroll: true }); announce(document.title); }
  requestAnimationFrame(() => {
    if (route.page === 'collection' || route.page === 'tours') document.getElementById(route.page === 'collection' ? 'collection' : 'tours').scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: scrollPositions.get(location.hash) || 0, behavior: 'instant' });
  });
  initial = false;
}
window.addEventListener('hashchange', () => { scrollPositions.set(activeHash, window.scrollY); activeHash = location.hash; render(); });
document.addEventListener('input', event => { if (event.target.id === 'collection-search') { query = event.target.value; updateGallery(); } });
document.addEventListener('click', event => {
  const expand = event.target.closest('[data-expand]');
  if (expand) {
    const demo = expand.closest('.demo');
    const running = demo.querySelector('[data-play][aria-pressed="true"], [data-audio][aria-pressed="true"]');
    running?.click();
    const drawing = demo.querySelector('.demo-stage > canvas, .demo-stage > svg');
    const image = document.getElementById('diagram-image');
    if (drawing.tagName.toLowerCase() === 'canvas') image.src = drawing.toDataURL('image/png');
    else { const copy = drawing.cloneNode(true); copy.setAttribute('width', '1080'); copy.setAttribute('height', '645'); const style = document.createElementNS('http://www.w3.org/2000/svg', 'style'); style.textContent = 'text{font-family:Arial,sans-serif;fill:#526674;font-size:12px}'; copy.prepend(style); diagramUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' })); image.src = diagramUrl; }
    image.alt = drawing.getAttribute('aria-label'); document.getElementById('diagram-title').textContent = `${document.querySelector('h1').textContent} · ${t("Diagram snapshot")}`; diagramDialog.showModal();
  }
  const save = event.target.closest('[data-save]');
  if (save) {
    const id = save.dataset.save;
    const wasSaved = notebook.saved.includes(id);
    notebook.saved = wasSaved ? notebook.saved.filter(value => value !== id) : [...notebook.saved, id];
    persist(); updateSavedCount();
    if (parseRoute(location.hash).page === 'notebook') { const y = window.scrollY; main.innerHTML = notebookPage(); window.scrollTo(0, y); }
    else { document.querySelectorAll(`[data-save="${id}"]`).forEach(button => { button.setAttribute('aria-pressed', !wasSaved); button.setAttribute('aria-label', `${getExhibit(id).title}: ${wasSaved ? t("add to notebook") : t("remove from notebook")}`); const text = button.querySelector('span'); if (text) text.textContent = wasSaved ? t("Save to notebook") : t("Saved"); }); }
    toast(wasSaved ? t("Object removed from your notebook.") : t("Object added to your notebook."));
  }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) { filter = filterButton.dataset.filter; updateGallery(); }
  if (event.target.closest('[data-clear-search]')) { query = ''; filter = 'All'; document.getElementById('collection-search').value = ''; updateGallery(); document.getElementById('collection-search').focus(); }
  if (event.target.closest('[data-random]')) { const pool = exhibits.filter(item => !notebook.visited.includes(item.id)); const choice = (pool.length ? pool : exhibits); location.hash = exhibitURL(choice[Math.floor(Math.random() * choice.length)].id); }
  const jump = event.target.closest('[data-jump]');
  if (jump) { const target = document.getElementById(jump.dataset.jump); target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  if (event.target.closest('[data-clear-notebook]')) { notebook = { visited: [], saved: [] }; persist(); main.innerHTML = notebookPage(); updateSavedCount(); toast(t("Notebook cleared.")); }
  if (event.target.closest('[data-export]')) {
    const data = { collection: t("Cabinet of Curiosities"), exportedAt: new Date().toISOString(), language: getLanguage(), saved: notebook.saved.map(id => ({ title: getExhibit(id).title, id, url: `https://kulieff21.github.io/merak-kabinesi/${getLanguage() === "tr" ? "?lang=tr" : ""}${exhibitURL(id)}` })), visited: notebook.visited };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'cabinet-of-curiosities-notebook.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
document.getElementById('language').addEventListener('change', event => {
  scrollPositions.set(location.hash, window.scrollY);
  setLanguage(event.target.value);
  rememberLanguage(storage, getLanguage());
  const url = new URL(location.href);
  if (getLanguage() === 'tr') url.searchParams.set('lang', 'tr'); else url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  render();
  document.getElementById('language').focus({ preventScroll: true });
});
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); });
document.getElementById('print-page').addEventListener('click', () => window.print());
document.getElementById('close-diagram').addEventListener('click', () => diagramDialog.close());
diagramDialog.addEventListener('click', event => { if (event.target === diagramDialog) diagramDialog.close(); });
diagramDialog.addEventListener('close', () => { if (diagramUrl) { URL.revokeObjectURL(diagramUrl); diagramUrl = null; } document.getElementById('diagram-image').removeAttribute('src'); });
window.addEventListener('pagehide', () => cleanup());
window.addEventListener('pageshow', event => { if (event.persisted) render(); });
render();
