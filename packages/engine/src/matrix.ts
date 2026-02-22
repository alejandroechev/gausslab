/** 2x2 ABCD ray transfer matrix [[A,B],[C,D]] stored as flat [A,B,C,D] */
export type Matrix2x2 = [number, number, number, number];

export function freeSpace(d: number): Matrix2x2 {
  return [1, d, 0, 1];
}

export function thinLens(f: number): Matrix2x2 {
  return [1, 0, -1 / f, 1];
}

export function curvedMirror(R: number): Matrix2x2 {
  return [1, 0, -2 / R, 1];
}

/** Flat interface between media n1 → n2 */
export function flatInterface(n1: number, n2: number): Matrix2x2 {
  return [1, 0, 0, n1 / n2];
}

/** Curved interface between media n1 → n2 with radius R */
export function curvedInterface(n1: number, n2: number, R: number): Matrix2x2 {
  return [1, 0, (n1 - n2) / (n2 * R), n1 / n2];
}

/** Multiply two 2x2 matrices: result = a × b */
export function multiply(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];
}

/** System matrix: M = Mₙ × ... × M₁ (elements in order of encounter) */
export function systemMatrix(elements: Matrix2x2[]): Matrix2x2 {
  if (elements.length === 0) return [1, 0, 0, 1]; // identity
  let result = elements[0];
  for (let i = 1; i < elements.length; i++) {
    result = multiply(elements[i], result);
  }
  return result;
}
