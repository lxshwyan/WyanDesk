/** CSS variables resolve relative url() at their stylesheet consumer, which moves into /assets in builds. */
export function backgroundImageValue(source: string, baseURI: string): string {
  if (!source) return 'none';
  try { return `url(${JSON.stringify(new URL(source, baseURI).href)})`; }
  catch { return 'none'; }
}
