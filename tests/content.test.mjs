import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { exhibits, sources, tours } from '../src/collection.js';
import { demoIds } from '../src/demos/index.js';
import { readNotebook, saveNotebook, normalizeSearch, parseRoute } from '../src/state.js';

test('nine distinct exhibits have live demos and complete interpretive records', () => {
  const ids = exhibits.map(item => item.id);
  assert.equal(ids.length, 9); assert.equal(new Set(ids).size, 9); assert.deepEqual([...ids].sort(), [...demoIds].sort());
  for (const item of exhibits) {
    assert.equal(item.sections.length, 3); assert.ok(item.sections.every(section => section.paragraphs.length === 2));
    assert.ok(item.lab.model.length > 90); assert.ok(item.lab.equation.length > 40); assert.ok(item.note.length > 60);
    assert.ok(item.sections.flatMap(section => section.paragraphs).join(' ').split(/\s+/).length >= 200);
    assert.ok(item.related.every(id => ids.includes(id) && id !== item.id));
  }
});
test('all citations resolve, all sources are used, each exhibit has multiple sources', () => {
  const used = new Set();
  for (const item of exhibits) {
    const refs = [...new Set([...item.sections.flatMap(section => section.refs), ...item.timeline.flatMap(event => event.refs)])];
    assert.ok(refs.length >= 2);
    for (const id of refs) { assert.ok(sources[id], `Missing source ${id}`); used.add(id); assert.equal(new URL(sources[id].url).protocol, 'https:'); assert.ok(sources[id].note.length > 25); }
  }
  assert.equal(used.size, Object.keys(sources).length);
});
test('three curated routes cover the full collection without duplicate stops', () => {
  assert.equal(tours.length, 3); assert.ok(tours.every(tour => tour.ids.length === 3 && new Set(tour.ids).size === 3));
  assert.deepEqual(tours.flatMap(tour => tour.ids).sort(), exhibits.map(item => item.id).sort());
});
test('notebook safely rejects corrupt, unknown, and duplicate state', () => {
  const ids = exhibits.map(item => item.id);
  assert.deepEqual(readNotebook({ getItem: () => '{broken' }, ids), { visited: [], saved: [] });
  assert.deepEqual(readNotebook({ getItem: () => JSON.stringify({ visited: [ids[0], ids[0], 'unknown'], saved: 'not an array' }) }, ids), { visited: [ids[0]], saved: [] });
  assert.equal(saveNotebook({ setItem: () => { throw new Error('quota'); } }, {}), false);
});
test('Turkish search handles dotted and dotless letters and direct routes are robust', () => {
  assert.equal(normalizeSearch('İŞIK'), 'isik'); assert.equal(normalizeSearch('Pnömatik'), 'pnomatik');
  assert.deepEqual(parseRoute('#/eser/jacquard?rota=dusunce'), { page: 'exhibit', id: 'jacquard', tour: 'dusunce' });
  assert.equal(parseRoute('#/%E0%A4%A').page, 'missing'); assert.equal(parseRoute('').page, 'home');
});
test('static entry points use local assets and include a no-script explanation', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('lang="en"')); assert.ok(html.includes('<noscript>')); assert.ok(html.includes('name="viewport"'));
  assert.ok(!/<script[^>]+src="https?:/i.test(html)); assert.ok(!/fonts\.googleapis/.test(html));
});
