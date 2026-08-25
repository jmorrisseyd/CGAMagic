/** All length-3 straight lines (horizontal, vertical, both diagonals) of cell indices on an R x C grid. */
export function buildLines(rows: number, cols: number): number[][] {
  const idx = (r: number, c: number) => r * cols + c;
  const lines: number[][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      lines.push([idx(r, c), idx(r, c + 1), idx(r, c + 2)]);
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r <= rows - 3; r++) {
      lines.push([idx(r, c), idx(r + 1, c), idx(r + 2, c)]);
    }
  }
  for (let r = 0; r <= rows - 3; r++) {
    for (let c = 0; c <= cols - 3; c++) {
      lines.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2)]);
      lines.push([idx(r, c + 2), idx(r + 1, c + 1), idx(r + 2, c)]);
    }
  }
  return lines;
}
