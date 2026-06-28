// Romanização aproximada do Hangul (Revised Romanization simplificada).
const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h']
const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i']
const JONG = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','l','l','m','p','','t','t','ng','t','t','k','t','p','t']

export function romanize(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const s = code - 0xac00
      const cho = Math.floor(s / 588)
      const jung = Math.floor((s % 588) / 28)
      const jong = s % 28
      out += CHO[cho] + JUNG[jung] + JONG[jong]
    } else {
      out += ch
    }
  }
  return out
}
