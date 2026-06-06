const SMALL_WORDS = new Set(['a', 'as', 'da', 'de', 'do', 'das', 'dos', 'e', 'em', 'o', 'os']);

export function formatPlaceName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\p{L}[\p{L}'’]*/gu, (word, index) => {
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}
