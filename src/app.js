import { exhibits, sources, tours, categories } from './collection.js';
import { illustration, cabinet } from './illustrations.js';
import { readNotebook, saveNotebook, normalizeSearch, parseRoute } from './state.js';
import { esc, icon, toast, announce } from './ui.js';
import { mountDemo } from './demos/index.js';

const main = document.getElementById('main');
const ids = exhibits.map(item => item.id);
const getExhibit = id => exhibits.find(item => item.id === id);
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
let notebook = readNotebook(storage, ids);
let filter = 'Tümü';
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
  return `<button class="${small ? 'save-object' : 'button secondary small'}" type="button" data-save="${item.id}" aria-label="${esc(item.title)}: ${saved ? 'defterden çıkar' : 'deftere ekle'}" aria-pressed="${saved}">${icon('star', 18)}${small ? '' : `<span>${saved ? 'Defterimde' : 'Defterime ekle'}</span>`}</button>`;
}
function card(item, index = -1) {
  return `<article class="specimen ${index === 0 || index === 6 ? 'wide' : ''}" data-exhibit="${item.id}"><a href="#/eser/${item.id}" class="card-link"><div class="art-field ${item.color}">${illustration(item.id, { decorative: true })}${notebook.visited.includes(item.id) ? `<span class="visited-dot">${icon('check', 12)} Bakıldı</span>` : ''}</div><div class="label"><span class="era">${esc(item.date)}</span><h3>${item.title}</h3><p class="teaser">${item.teaser}</p><span class="card-open">Düzeneği keşfet ${icon('arrow', 16)}</span></div></a>${saveButton(item)}</article>`;
}
function home() {
  return `<div class="wrap"><section class="hero" aria-labelledby="home-title"><div class="hero-copy"><div class="collection-note">İlk seçki · Dokuz tuhaf icat</div><h1 id="home-title">Bazı fikirler<br>biraz tuhaftır.</h1><p>Sesi betonla dinlemek. Bir resmi deliklerden geçirmek. Bir deseni kartlara saklamak.<br>İnsan aklının dolabına hoş geldin.</p><div class="hero-actions"><a class="button" href="#/koleksiyon">Kabineyi aç ${icon('arrow', 18)}</a><button class="text-button" type="button" data-random>${icon('shuffle', 16)} Beni şaşırt</button></div></div><figure class="hero-figure">${cabinet(exhibits)}<figcaption><span>✧</span> Bir nesneye dokun. Bir fikrin içine gir.</figcaption></figure></section><div class="manifesto"><p class="small-copy">Bazıları gündelik hayatı değiştirdi.<br>Bazıları bir deney olarak kaldı.<br>Hepsinin içinde iyi bir soru var.</p><p>Bu kabinede camın arkasında durmak yok.<br>Kolları çevir, kartları del, ışığın yolunu değiştir.</p></div><section id="collection" aria-labelledby="collection-title"><div class="section-intro"><h2 id="collection-title">Neyi merak ettin?</h2><p>Bir nesne seç. Hikâyesini oku, düzeneğini çalıştır, fikrinin nerede bittiğine bak.</p></div><div class="collection-toolbar"><div class="filters" role="group" aria-label="Koleksiyonu konuya göre süz">${categories.map(category => `<button type="button" class="filter" data-filter="${category}" aria-pressed="${filter === category}">${category}</button>`).join('')}</div><label class="search">${icon('search', 18)}<span class="sr-only">Koleksiyonda ara</span><input id="collection-search" type="search" placeholder="Bir nesne, malzeme, fikir…" value="${esc(query)}" autocomplete="off"></label></div><div class="result-summary" id="result-summary" role="status" aria-live="polite"></div><div class="collection-grid" id="collection-grid"></div></section><section class="tour-section" id="tours" aria-labelledby="tour-title"><div class="section-intro"><h2 id="tour-title">Bir merak diğerini açar.</h2><p>Üç nesne, ortak bir soru.<br>Başlangıç noktası arayanlara küçük rotalar.</p></div><div class="tour-grid">${tours.map(tour => `<article class="tour-card ${tour.color}"><h3>${tour.title}</h3><p>${tour.text}</p><div class="tour-objects" aria-hidden="true">${tour.ids.map(id => illustration(id, { decorative: true })).join('')}</div><a href="#/eser/${tour.ids[0]}?rota=${tour.id}"><span class="tour-length">3 durak</span>Rotayı gez ${icon('arrow', 17)}</a></article>`).join('')}</div></section><section class="closing-note"><div><h3>Merakın bir de arka odası var.</h3><p>Hangi bilgi nereden geliyor? Neyi biliyoruz, neyi yalnızca modelliyoruz? Kaynak defteri de açık.</p></div><a href="#/kaynaklar" class="button secondary">Kaynak defterini aç ${icon('book', 17)}</a></section></div>`;
}
function updateGallery() {
  const needle = normalizeSearch(query);
  const matches = exhibits.filter(item => (filter === 'Tümü' || item.category === filter) && normalizeSearch([item.title, item.subtitle, item.teaser, item.material, item.place, item.date, item.category].join(' ')).includes(needle));
  const gallery = document.getElementById('collection-grid');
  if (!gallery) return;
  gallery.innerHTML = matches.length ? matches.map((item, index) => card(item, matches.length === 9 ? index : -1)).join('') : `<div class="empty-state"><h3>Bu çekmecede bir şey bulamadık.</h3><p>Başka bir kelime deneyebilir ya da bütün koleksiyona dönebilirsin.</p><button type="button" class="text-button" data-clear-search>Aramayı ve filtreyi temizle ${icon('reset', 16)}</button></div>`;
  document.getElementById('result-summary').textContent = needle || filter !== 'Tümü' ? `${matches.length} nesne bulundu` : 'Dokuz nesne · Hepsi kurcalanabilir';
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === filter));
}
function sourceIds(item) { return [...new Set([...item.sections.flatMap(section => section.refs), ...item.timeline.flatMap(event => event.refs)])]; }
function cite(refs, all) {
  return refs?.length ? `<span class="citations">${refs.map(id => `<a class="citation" href="${sources[id].url}" target="_blank" rel="noopener noreferrer" aria-label="Kaynak ${all.indexOf(id) + 1}: ${esc(sources[id].title)}">${all.indexOf(id) + 1}</a>`).join('')}</span>` : '';
}
function sourceList(refs) { return `<ol class="source-list">${refs.map(id => { const source = sources[id]; return `<li id="source-${id}"><span class="institution">${source.institution}</span><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}</a><p>${source.note}</p></li>`; }).join('')}</ol>`; }
function detail(item, tourId) {
  const refs = sourceIds(item);
  const tour = tours.find(candidate => candidate.id === tourId && candidate.ids.includes(item.id));
  const stop = tour?.ids.indexOf(item.id);
  const next = tour?.ids[stop + 1];
  const nextLink = next ? `#/eser/${next}?rota=${tour.id}` : '#/rotalar';
  return `<div class="wrap"><div class="breadcrumb"><a href="#/koleksiyon">${icon('back', 15)} Koleksiyon</a><span>${item.category}</span><span>${item.title}</span></div>${tour ? `<div class="tour-progress"><span>${tour.title} · ${stop + 1} / 3. durak</span><a href="${nextLink}">${next ? `Sıradaki: ${getExhibit(next).title}` : 'Rota tamamlandı · Rotalara dön'} ${icon('arrow', 15)}</a></div>` : ''}<section class="object-hero"><div><div class="collection-note">${item.date}</div><h1>${item.title}</h1><p class="subtitle">${item.subtitle}</p><p class="intro">${item.intro}</p><div class="object-meta"><span>Yer / bağlam<strong>${item.place}</strong></span><span>Malzemeler<strong>${item.material}</strong></span></div><div class="object-actions"><button class="button small" type="button" data-jump="experiment">Düzeneği çalıştır ${icon('play', 16)}</button>${saveButton(item, false)}</div></div><div class="hero-illustration">${illustration(item.id)}</div></section><section class="lab" id="experiment" aria-labelledby="lab-title"><div class="lab-label">Deney masası · Açıklayıcı model</div><h2 id="lab-title">${item.lab.title}</h2><p class="lab-instruction">${item.lab.instruction}</p><div id="demo-root" class="demo" data-demo="${item.id}"></div><p class="lab-observation">${item.lab.observation}</p><details class="model-notes"><summary>Bu model neyi gösteriyor? Varsayımlar ve matematik</summary><p>${item.lab.model}</p><div class="equation">${item.lab.equation}</div></details></section><div class="reading-layout"><aside class="reading-sidebar" aria-label="Nesnenin hikâyesi"><p>${item.question}</p>${item.sections.map((section, i) => `<button class="text-button" type="button" data-jump="story-${i}">${section.title}</button>`).join('')}<button type="button" class="text-button" data-jump="object-sources">Kaynaklara bak ${icon('external', 14)}</button></aside><div class="story-body">${item.sections.map((section, i) => `<section class="story-section" id="story-${i}"><h2>${section.title}</h2>${section.paragraphs.map((paragraph, index) => `<p>${paragraph}${index === section.paragraphs.length - 1 ? cite(section.refs, refs) : ''}</p>`).join('')}</section>`).join('')}<section class="story-section"><h2>Zaman içindeki yeri</h2><ol class="timeline">${item.timeline.map(event => `<li><strong>${event.date}</strong>${event.text}${cite(event.refs, refs)}</li>`).join('')}</ol></section><aside class="editorial-note"><strong>Nesneye düşülen not</strong>${item.note}</aside><section class="story-section" id="object-sources"><h2>Kaynak defteri</h2>${sourceList(refs)}</section></div></div>${tour ? `<div class="tour-progress"><span>${stop === 2 ? 'Üç nesne, ortak bir soru. Bu rotanın sonuna geldin.' : `${tour.title} rotasında devam et.`}</span><a href="${nextLink}">${next ? getExhibit(next).title : 'Başka bir rota seç'} ${icon('arrow', 16)}</a></div>` : ''}<section class="related"><h2>Bu çekmece şunlara açılır.</h2><div class="related-grid">${item.related.map(id => { const other = getExhibit(id); return `<a class="related-item" href="#/eser/${id}">${illustration(id, { decorative: true })}<div><h3>${other.title}</h3><p>${other.subtitle}</p></div></a>`; }).join('')}</div></section></div>`;
}
function notebookPage() {
  const saved = notebook.saved.map(getExhibit);
  return `<div class="wrap"><div class="page-heading"><div class="collection-note">Kendi küçük koleksiyonun</div><h1>Not defterim</h1><p>Bir nesne sende bir soru bıraktıysa yıldızına dokun. Geri dönmek istediğin çekmeceler burada birikir. Defter bu tarayıcıda saklanır.</p></div><div class="notebook-summary"><p><strong>${notebook.visited.length} / 9</strong> nesneye bakıldı · <strong>${saved.length}</strong> nesne defterinde</p><div class="control-buttons"><button type="button" class="button secondary small" data-export ${!notebook.visited.length && !saved.length ? 'disabled' : ''}>${icon('download', 16)} Defteri indir</button><button type="button" class="text-button" data-clear-notebook ${!notebook.visited.length && !saved.length ? 'disabled' : ''}>Defteri temizle</button></div></div><div class="collection-grid">${saved.length ? saved.map(item => card(item)).join('') : `<div class="empty-state"><h3>İlk sayfa henüz boş.</h3><p>Koleksiyondaki yıldızlar, nesneleri bu deftere ekler.</p><a class="button secondary small" href="#/koleksiyon" style="margin-top:22px">Bir nesne seç ${icon('arrow', 16)}</a></div>`}</div>${notebook.visited.length ? `<section class="notebook-visited"><h2>Uğradığın çekmeceler</h2><div class="visited-list">${notebook.visited.map(id => `<a href="#/eser/${id}">${getExhibit(id).title}</a>`).join('')}</div></section>` : ''}</div>`;
}
function sourcesPage() {
  return `<div class="wrap"><div class="page-heading"><div class="collection-note">Kabinenin arka odası</div><h1>Kaynak defteri</h1><p>Bir müze kaydı, bir patent, bir araştırma. Her nesnenin hikâyesi bir yere dayanıyor. Tam sayfa ile yalnızca erişilebilen özeti okuduğumuz yerleri aşağıda ayırdık.</p><span class="source-count">${Object.keys(sources).length} kaynak · Son kontrol: 13 Kasım 2026</span></div><div class="source-book">${exhibits.map(item => `<section class="source-group"><h2><a href="#/eser/${item.id}">${item.title}</a></h2>${sourceList(sourceIds(item))}</section>`).join('')}</div></div>`;
}
function aboutPage() {
  return `<div class="wrap"><div class="page-heading"><div class="collection-note">Bu kabine hakkında</div><h1>Biraz kurcalamak serbest.</h1><p>Merak Kabinesi, dokuz tarihsel nesne üzerinden insanın bir fikri nasıl çalışır hâle getirdiğini araştıran küçük bir dijital müze.</p></div><div class="about-body"><h2>Neden bu nesneler?</h2><p>Bazıları bilgi taşır, bazıları ışığı, bazıları bir hareketi. Aralarındaki bağ “eski ve tuhaf” olmalarıyla sınırlı değil: her biri düşünceyi maddeye çevirmenin farklı bir yolunu gösteriyor. Bir kart seçim yapıyor, bir yüzey ses topluyor, bir dişli oran saklıyor.</p><h2>Hikâye, kanıt, model</h2><p>Tarihsel anlatılar müze ve koruma kayıtlarına, özgün araştırmalara ve patente dayanır. Tarihler veya atıflar farklılaştığında bu fark nesne notunda görünür. Kaynak defteri, tam metin ile arama dizininden ya da özetten okunan kısımları ayırır.</p><p>Deney masaları birer açıklayıcı modeldir. Her birinin varsayımları ve hesapları kendi panelinde yazılıdır. Ekranda çalışan bir düzenek, tarihsel aygıtın bütün fiziksel özelliklerini doğruladığımız anlamına gelmez.</p><h2>Çizimler ve ses</h2><p>Nesne çizimleri ve deney görselleri bu kabine için özgün olarak üretildi. Müze fotoğrafları kullanılmadı; çizimler kesin ölçülü rekonstrüksiyonlar değildir. Theremin sesi yalnız sen açtığında başlar. Sayfadan ayrılınca susar.</p><h2>Burada bıraktığın iz</h2><p>Not defteri yalnız bu tarayıcıda tutulur. Hesap, izleme kodu veya analitik yok. Defterini dosya olarak indirebilir ya da temizleyebilirsin. Fontlar ve bütün sergi dosyaları sitenin kendi içinden yüklenir.</p><h2>Gezme biçimleri</h2><ul><li>Nesnelere dolaptan ya da koleksiyondan gir.</li><li>Üç duraklı rotalarla ortak bir soruyu takip et.</li><li>Kaydırıcıları klavyedeki ok tuşlarıyla da kullan.</li><li>Hareketleri çalıştırıp duraklatabilir, tek adımlarla ilerletebilirsin.</li><li>Harmonografın çizimini SVG, not defterini JSON olarak indirebilirsin.</li></ul><p>Elmar Quliyev için hazırlanmış ilk seçki, Kasım 2026.</p><a href="https://github.com/kulieff21/merak-kabinesi" class="button secondary small" target="_blank" rel="noopener noreferrer" style="margin-top:25px">Kaynak kodunu incele ${icon('external', 16)}</a></div></div>`;
}
function persist() { if (!saveNotebook(storage, notebook)) toast('Defter bu oturumda açık; tarayıcı kalıcı kayda izin vermedi.'); }
function updateSavedCount() {
  const count = document.getElementById('saved-count');
  count.textContent = notebook.saved.length; count.hidden = !notebook.saved.length;
}
function render() {
  if (diagramDialog.open) diagramDialog.close();
  cleanup(); cleanup = () => {};
  const route = parseRoute(location.hash);
  const item = route.page === 'eser' && getExhibit(route.id);
  const isHome = ['home', 'koleksiyon', 'rotalar'].includes(route.page);
  if (item) {
    if (!notebook.visited.includes(item.id)) { notebook.visited.push(item.id); persist(); }
    main.innerHTML = detail(item, route.tour);
    document.title = `${item.title} — Merak Kabinesi`;
    try { cleanup = mountDemo(item.id, document.getElementById('demo-root')); }
    catch (error) { document.getElementById('demo-root').innerHTML = '<p>Düzenek yüklenemedi. Sayfayı yenileyerek yeniden deneyebilirsin; nesnenin hikâyesi aşağıda açık.</p>'; console.error(error); }
  } else if (isHome) {
    main.innerHTML = home(); updateGallery();
    document.title = 'Merak Kabinesi — Biraz kurcalamak serbest';
  } else if (route.page === 'defter') { main.innerHTML = notebookPage(); document.title = 'Not defterim — Merak Kabinesi'; }
  else if (route.page === 'kaynaklar') { main.innerHTML = sourcesPage(); document.title = 'Kaynak defteri — Merak Kabinesi'; }
  else if (route.page === 'hakkinda') { main.innerHTML = aboutPage(); document.title = 'Bu kabine hakkında — Merak Kabinesi'; }
  else { main.innerHTML = '<div class="wrap not-found"><h1>Bu çekmece burada değil.</h1><p>Koleksiyonda başka bir nesne seçebilirsin.</p><a class="button" href="#/koleksiyon">Koleksiyona dön</a></div>'; document.title = 'Çekmece bulunamadı — Merak Kabinesi'; }
  document.querySelectorAll('[data-nav]').forEach(link => {
    const selected = (link.dataset.nav === 'collection' && ((isHome && route.page !== 'rotalar') || item)) || (link.dataset.nav === 'notebook' && route.page === 'defter') || (link.dataset.nav === 'sources' && route.page === 'kaynaklar') || (link.dataset.nav === 'tours' && route.page === 'rotalar');
    if (selected) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  updateSavedCount();
  if (!initial) { main.focus({ preventScroll: true }); announce(document.title); }
  requestAnimationFrame(() => {
    if (route.page === 'koleksiyon' || route.page === 'rotalar') document.getElementById(route.page === 'koleksiyon' ? 'collection' : 'tours').scrollIntoView({ behavior: 'instant', block: 'start' });
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
    image.alt = drawing.getAttribute('aria-label'); document.getElementById('diagram-title').textContent = `${document.querySelector('h1').textContent} · Deney çizimi`; diagramDialog.showModal();
  }
  const save = event.target.closest('[data-save]');
  if (save) {
    const id = save.dataset.save;
    const wasSaved = notebook.saved.includes(id);
    notebook.saved = wasSaved ? notebook.saved.filter(value => value !== id) : [...notebook.saved, id];
    persist(); updateSavedCount();
    if (parseRoute(location.hash).page === 'defter') { const y = window.scrollY; main.innerHTML = notebookPage(); window.scrollTo(0, y); }
    else { document.querySelectorAll(`[data-save="${id}"]`).forEach(button => { button.setAttribute('aria-pressed', !wasSaved); button.setAttribute('aria-label', `${getExhibit(id).title}: ${wasSaved ? 'deftere ekle' : 'defterden çıkar'}`); const text = button.querySelector('span'); if (text) text.textContent = wasSaved ? 'Defterime ekle' : 'Defterimde'; }); }
    toast(wasSaved ? 'Nesne defterinden çıkarıldı.' : 'Nesne not defterine eklendi.');
  }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) { filter = filterButton.dataset.filter; updateGallery(); }
  if (event.target.closest('[data-clear-search]')) { query = ''; filter = 'Tümü'; document.getElementById('collection-search').value = ''; updateGallery(); document.getElementById('collection-search').focus(); }
  if (event.target.closest('[data-random]')) { const pool = exhibits.filter(item => !notebook.visited.includes(item.id)); const choice = (pool.length ? pool : exhibits); location.hash = `#/eser/${choice[Math.floor(Math.random() * choice.length)].id}`; }
  const jump = event.target.closest('[data-jump]');
  if (jump) { const target = document.getElementById(jump.dataset.jump); target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  if (event.target.closest('[data-clear-notebook]')) { notebook = { visited: [], saved: [] }; persist(); main.innerHTML = notebookPage(); updateSavedCount(); toast('Defter temizlendi.'); }
  if (event.target.closest('[data-export]')) {
    const data = { collection: 'Merak Kabinesi', exportedAt: new Date().toISOString(), saved: notebook.saved.map(id => ({ title: getExhibit(id).title, id, url: `https://kulieff21.github.io/merak-kabinesi/#/eser/${id}` })), visited: notebook.visited };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'merak-kabinesi-defterim.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); });
document.getElementById('print-page').addEventListener('click', () => window.print());
document.getElementById('close-diagram').addEventListener('click', () => diagramDialog.close());
diagramDialog.addEventListener('click', event => { if (event.target === diagramDialog) diagramDialog.close(); });
diagramDialog.addEventListener('close', () => { if (diagramUrl) { URL.revokeObjectURL(diagramUrl); diagramUrl = null; } document.getElementById('diagram-image').removeAttribute('src'); });
window.addEventListener('pagehide', () => cleanup());
window.addEventListener('pageshow', event => { if (event.persisted) render(); });
render();
