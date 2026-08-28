/**
 * Shared keyboard layouts for the activities that take letter or text input.
 */

/** Standard QWERTY, which is what the classroom keyboards actually are. */
export const QWERTY_ROWS: readonly string[] = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

/**
 * Accented letters, grouped by base vowel so they're quick to scan.
 * Chosen to cover Spanish (á é í ó ú ü ñ), French (à â ä é è ê ë î ï ô ö
 * ù û ü ç œ) and Italian (à è é ì í î ò ó ù ú) in one row set, with ß
 * kept because the department's German files use it.
 */
export const ACCENT_KEYS: readonly string[] = [
  "à", "á", "â", "ä",
  "è", "é", "ê", "ë",
  "ì", "í", "î", "ï",
  "ò", "ó", "ô", "ö",
  "ù", "ú", "û", "ü",
  "ç", "ñ", "œ", "ß",
];

/**
 * Spanish opening punctuation, which is genuinely awkward to type on a UK
 * keyboard. Only offered where students type free text, never in Hangman
 * (punctuation isn't guessed there).
 */
export const PUNCTUATION_KEYS: readonly string[] = ["¿", "¡"];

/** Any Unicode letter counts as guessable/typable. */
export const LETTER = /\p{L}/u;

/**
 * The accent keys to show for a particular set: the standard list, plus
 * any accented letter the content uses that the standard list misses, so
 * an unusual character can still be entered.
 */
export function accentKeysFor(texts: string[]): string[] {
  const extras = new Set<string>();
  for (const text of texts) {
    for (const ch of text.toLowerCase()) {
      if (
        ch.charCodeAt(0) > 127 &&
        LETTER.test(ch) &&
        !ACCENT_KEYS.includes(ch)
      ) {
        extras.add(ch);
      }
    }
  }
  return [...ACCENT_KEYS, ...[...extras].sort()];
}

/**
 * True when a keystroke should be treated as text entry rather than a
 * shortcut — a single letter with no command/control modifier.
 */
export function isTypedLetter(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  return e.key.length === 1 && LETTER.test(e.key);
}
