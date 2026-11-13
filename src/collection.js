import * as english from './locales/collection.en.js';
import * as turkish from './locales/collection.tr.js';
import { exhibitSlugs } from './routes.js';

const categoryIds = { Ses: 'Sound', Görüntü: 'Vision', Bilgi: 'Information', Hareket: 'Motion' };
const prepare = collection => ({ ...collection,
  categories: ['All', 'Sound', 'Vision', 'Information', 'Motion'],
  exhibits: collection.exhibits.map(item => ({ ...item, slug: exhibitSlugs[item.id], category: categoryIds[item.category] || item.category })),
});
export const collections = { en: prepare(english), tr: prepare(turkish) };
export function getCollection(language = 'en') { return collections[language] || collections.en; }
export const { exhibits, sources, tours, categories } = collections.en;
