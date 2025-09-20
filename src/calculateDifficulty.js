// 難易度計算関数
// pageviews（閲覧数）を元に難易度を0.0〜10.0で返す（閲覧数が多いほど易しい）
export function calculateDifficulty(pageviews) {
  if (typeof pageviews !== 'number' || isNaN(pageviews)) return 5.0;
  // 例: 10万以上→1.0, 1万→3.0, 1000→7.0, 100未満→10.0 など
  if (pageviews >= 100000) return 1.0;
  if (pageviews >= 50000) return 2.0;
  if (pageviews >= 20000) return 3.0;
  if (pageviews >= 10000) return 4.0;
  if (pageviews >= 5000) return 5.0;
  if (pageviews >= 2000) return 6.0;
  if (pageviews >= 1000) return 7.0;
  if (pageviews >= 500) return 8.0;
  if (pageviews >= 100) return 9.0;
  return 10.0;
}
