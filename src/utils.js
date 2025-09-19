// 文字列を正規化する関数（全角→半角、スペース削除）
export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[\s　]/g, "");
};

// テキスト内の特定の単語を、その文字数分の「●」に置き換える関数
export const maskText = (text, title) => {
  let masked = text;
  const unmaskable = [];
  const replacer = (match) => '●'.repeat(match.length);
  const captureReplacer = (match, content) => {
    if (content.toLowerCase() !== title.toLowerCase()) {
      unmaskable.push(content);
    }
    return `<b>${'●'.repeat(content.length)}</b>`;
  };
  masked = masked.replace(/<b>(.*?)<\/b>/g, captureReplacer);
  masked = masked.replace(/（(.*?)）/g, (match, content) => {
    if (content) unmaskable.push(content);
    return `（${'●'.repeat(content.length)}）`;
  });
  masked = masked.replace(/\((.*?)\)/g, (match, content) => {
    if (content) unmaskable.push(content);
    return `(${'●'.repeat(content.length)})`;
  });
  const titleRegex = new RegExp(title, 'gi');
  masked = masked.replace(titleRegex, replacer);
  masked = masked.replace(/<[^>]+>/g, '');
  return { maskedText: masked, unmaskableWords: unmaskable };
};