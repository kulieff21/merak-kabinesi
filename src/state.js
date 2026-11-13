const key = 'merak-kabinesi.v1';
export function readNotebook(storage, validIds) {
  try {
    const data = JSON.parse(storage.getItem(key) || '{}');
    return { visited: clean(data.visited, validIds), saved: clean(data.saved, validIds) };
  } catch { return { visited: [], saved: [] }; }
}
function clean(values, validIds) {
  return Array.isArray(values) ? [...new Set(values.filter(id => validIds.includes(id)))] : [];
}
export function saveNotebook(storage, notebook) {
  try { storage.setItem(key, JSON.stringify(notebook)); return true; } catch { return false; }
}
export function normalizeSearch(value) {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('ı', 'i').trim();
}
export function parseRoute(hash) {
  let decoded;
  try { decoded = decodeURIComponent(hash.replace(/^#\/?/, '')); } catch { return { page: 'missing' }; }
  const [path, search = ''] = decoded.split('?');
  const [page = '', id] = path.split('/');
  return { page: page || 'home', id, tour: new URLSearchParams(search).get('rota') };
}
