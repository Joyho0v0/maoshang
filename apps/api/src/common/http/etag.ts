export function formatEtag(version: number): string {
  if (!Number.isInteger(version) || version < 1) throw new Error('ETag version must be a positive integer.');
  return `"v${version}"`;
}

export function parseEtag(value: string | undefined): number | undefined {
  if (value === undefined || value === '*') return undefined;
  const match = /^"v([1-9][0-9]*)"$/.exec(value);
  return match === null ? undefined : Number(match[1]);
}
