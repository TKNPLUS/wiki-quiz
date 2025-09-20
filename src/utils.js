// ▼▼▼ 既存の utils.js の中身を、これに全て置き換えてください ▼▼▼

export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[\s　]/g, "");
};

export const maskText = (text, title) => {
  let masked = text;
  const unmaskable = [];
  const replacer = (match) => '●'.repeat(match.length);
  const captureReplacer = (match, content) => {
    if (content && title && content.toLowerCase() !== title.toLowerCase()) {
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

export const fetchRandomArticle = async (settings) => {
  const url = "https://ja.wikipedia.org/w/api.php";
  const commonParams = "&format=json&origin=*";
  
  let bestArticle = null;
  let maxViews = -1;

  for (let i = 0; i < settings.fetchAttempts; i++) {
    try {
      const randomListParams = `?action=query&list=random&rnnamespace=0&rnlimit=${settings.fetchBatchSize}${commonParams}`;
      const randomResponse = await fetch(url + randomListParams);
      const randomData = await randomResponse.json();
      const titles = randomData.query.random.map(p => p.title).join('|');
      
      const detailsParams = `?action=query&prop=extracts|pageviews&titles=${encodeURIComponent(titles)}${commonParams}`;
      const detailsResponse = await fetch(url + detailsParams);
      const detailsData = await detailsResponse.json();

      if (!detailsData.query || !detailsData.query.pages) continue;

      const pages = Object.values(detailsData.query.pages);
      for (const page of pages) {
        if (!page.extract) continue;
        const pageviews = page.pageviews ? Object.values(page.pageviews).reduce((a, b) => a + b, 0) : 0;
        if (pageviews > maxViews) {
          maxViews = pageviews;
          bestArticle = page;
        }
      }
    } catch (error) {
      console.error(`APIリクエスト中にエラー (試行 ${i + 1}回目):`, error);
    }
  }

  if (bestArticle) {
    const { maskedText, unmaskableWords } = maskText(bestArticle.extract, bestArticle.title);
    const pageviews = bestArticle.pageviews ? Object.values(bestArticle.pageviews).reduce((a, b) => a + b, 0) : 0;
    return {
      article: { title: bestArticle.title, extract: bestArticle.extract, pageviews },
      maskedText,
      unmaskableWords
    };
  }
  
  console.error("表示できる記事が見つかりませんでした。");
  return null;
};