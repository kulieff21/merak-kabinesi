import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { collections, getCollection } from '../src/collection.js';
import { getLanguage, setLanguage, resolveLanguage, rememberLanguage, t } from '../src/i18n.js';
import { messages } from '../src/locales/ui.tr.js';
import { exhibitURL } from '../src/routes.js';
import { parseRoute, readNotebook } from '../src/state.js';
import { format } from '../src/ui.js';

afterEach(() => setLanguage('en'));
test('English is the fresh default; explicit URLs override saved preferences', () => {
  assert.equal(getLanguage(), 'en'); assert.equal(resolveLanguage(''), 'en');
  assert.equal(resolveLanguage('', { getItem: () => 'tr' }), 'tr');
  assert.equal(resolveLanguage('?lang=en', { getItem: () => 'tr' }), 'en');
  assert.equal(resolveLanguage('?lang=tr', { getItem: () => 'en' }), 'tr');
  assert.equal(resolveLanguage('?lang=de', { getItem: () => 'unknown' }), 'en');
  assert.equal(resolveLanguage('', { getItem: () => { throw new Error('blocked'); } }), 'en');
  assert.equal(rememberLanguage({ setItem: () => { throw new Error('quota'); } }, 'tr'), false);
});
test('both collections retain full narratives, source evidence and identical object identities', () => {
  assert.equal(getCollection().exhibits[0].title, 'Acoustic mirror');
  assert.equal(getCollection('tr').exhibits[0].title, 'Ses aynası');
  assert.deepEqual(collections.en.exhibits.map(x => x.id), collections.tr.exhibits.map(x => x.id));
  assert.deepEqual(Object.keys(collections.en.sources).sort(), Object.keys(collections.tr.sources).sort());
  for (const language of ['en', 'tr']) for (const item of collections[language].exhibits) {
    assert.equal(item.sections.length, 3); assert.ok(item.sections.every(section => section.paragraphs.length === 2));
    assert.ok(item.lab.model.length > 80); assert.ok(item.note.length > 50);
    assert.ok(item.timeline.every(event => event.refs.length > 0));
  }
  for (const id of Object.keys(collections.en.sources)) {
    assert.equal(collections.en.sources[id].url, collections.tr.sources[id].url);
    assert.ok(collections.en.sources[id].note.length > 35);
  }
});
test('Turkish source messages preserve every interpolation placeholder', () => {
  const placeholders = text => [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match => match[1]).sort();
  for (const [english, turkish] of Object.entries(messages)) {
    assert.ok(turkish.length > 0, english); assert.deepEqual(placeholders(english), placeholders(turkish), english);
  }
  assert.equal(t('Found {count} objects', { count: 9 }), 'Found 9 objects');
  setLanguage('tr'); assert.equal(t('Found {count} objects', { count: 9 }), '9 nesne bulundu');
});
test('decimal and thousands separators follow the selected language', () => {
  assert.equal(format(1234.5), '1,234.5');
  setLanguage('tr'); assert.equal(format(1234.5), '1.234,5');
});
test('English canonical links and old Turkish links resolve to the same stored objects', () => {
  for (const item of collections.en.exhibits) {
    assert.equal(parseRoute(exhibitURL(item.id)).id, item.id);
    assert.equal(parseRoute(`#/eser/${item.id}`).id, item.id);
  }
  assert.equal(parseRoute('#/exhibit/acoustic-mirror?tour=unseen').tour, 'gorunmeyen');
  assert.equal(parseRoute('#/koleksiyon').page, 'collection');
  const notebook = readNotebook({ getItem: () => '{"saved":["ses-aynalari"],"visited":["theremin"]}' }, collections.en.exhibits.map(x => x.id));
  assert.deepEqual(notebook.saved, ['ses-aynalari']);
});
test('every literal UI message and document-shell message has a Turkish translation', async () => {
  const files = ['app.js', 'illustrations.js', ...(await readdir(new URL('../src/demos/', import.meta.url))).filter(file => file.endsWith('.js')).map(file => `demos/${file}`)];
  for (const file of files) {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/\bt\(("(?:[^"\\]|\\.)*")/g)) {
      const key = JSON.parse(match[1]); assert.ok(Object.hasOwn(messages, key), `${file}: ${key}`);
    }
  }
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-html|-content|-label)?="([^"]+)"/g)) {
    const key = match[1].replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    assert.ok(Object.hasOwn(messages, key), key);
  }
  for (const category of collections.en.categories) assert.ok(Object.hasOwn(messages, category));
});
