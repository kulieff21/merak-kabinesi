export const exhibitSlugs = {
  'ses-aynalari': 'acoustic-mirror',
  'mekanik-televizyon': 'mechanical-television',
  'pnomatik-posta': 'pneumatic-mail',
  antikythera: 'antikythera', jacquard: 'jacquard', theremin: 'theremin',
  harmonograf: 'harmonograph', zoetrop: 'zoetrope', 'sihirli-fener': 'magic-lantern',
};
export const tourSlugs = { gorunmeyen: 'unseen', goz: 'vision', dusunce: 'thought' };
const reverse = entries => Object.fromEntries(Object.entries(entries).map(([id, slug]) => [slug, id]));
export const exhibitId = slug => reverse(exhibitSlugs)[slug] || slug;
export const tourId = slug => reverse(tourSlugs)[slug] || slug;
export function exhibitURL(id, tour) { return `#/exhibit/${exhibitSlugs[id] || id}${tour ? `?tour=${tourSlugs[tour] || tour}` : ''}`; }
export function canonicalPage(page) { return ({ eser: 'exhibit', koleksiyon: 'collection', rotalar: 'tours', defter: 'notebook', kaynaklar: 'sources', hakkinda: 'about' })[page] || page || 'home'; }
