/** 兼容根路径与 GitHub Pages 子路径 */
export function assetUrl(file: string): string {
  const base = import.meta.env.BASE_URL
  const normalized = file.replace(/^\/+/, '')
  return `${base}${normalized}`
}
