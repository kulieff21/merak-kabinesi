import { messages } from './locales/ui.tr.js';

export const languages = ['en', 'tr'];
export const languageKey = 'cabinet-language.v1';
let language = 'en';
export const getLanguage = () => language;
export function setLanguage(value) { language = languages.includes(value) ? value : 'en'; return language; }
export function resolveLanguage(search = '', storage) {
  const requested = new URLSearchParams(search).get('lang');
  if (languages.includes(requested)) return requested;
  try { const saved = storage?.getItem(languageKey); if (languages.includes(saved)) return saved; } catch {}
  return 'en';
}
export function rememberLanguage(storage, value) {
  try { storage?.setItem(languageKey, languages.includes(value) ? value : 'en'); return true; } catch { return false; }
}
/** English source messages are the stable keys; Turkish is an explicit resource. */
export function t(message, parameters = {}) {
  const template = language === 'tr' ? messages[message] ?? message : message;
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match, key) => Object.hasOwn(parameters, key) ? String(parameters[key]) : match);
}
