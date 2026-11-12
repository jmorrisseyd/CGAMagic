/**
 * Splits one pasted line into its two halves at the first separator: a
 * tab, then " - ", then a comma. The dash is tried before the comma because
 * answers often contain commas ("bonjour - hello, good morning"), and only
 * the first separator splits so the rest of the answer is kept as typed.
 */
export function splitBulkLine(line: string): [string, string] | null {
  for (const separator of [/\t/, /\s+-\s+/, /,/]) {
    const match = separator.exec(line);
    if (!match) continue;
    const left = line.slice(0, match.index).trim();
    const right = line.slice(match.index + match[0].length).trim();
    if (left && right) return [left, right];
  }
  return null;
}
