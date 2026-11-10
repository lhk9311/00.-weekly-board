/**
 * 담당자 아바타 표시용 유틸
 * 이름 문자열로부터 항상 같은 색을 고르도록 간단한 해시를 사용한다.
 */
const AVATAR_COLORS = ['#5b5bd6', '#0f8b8d', '#c2410c', '#7c3aed', '#2563eb', '#be185d', '#15803d', '#a16207']

export function avatarColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/** 아바타에 넣을 글자: 한글 이름은 성을 뺀 뒤 글자, 영문은 첫 글자 */
export function avatarInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  if (/^[가-힣]{3,4}$/.test(trimmed)) return trimmed.slice(1, 3)
  return trimmed.slice(0, 1).toUpperCase()
}
