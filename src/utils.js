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

export const fetchRandomArticle = async (settings) => {
  const url = "https://ja.wikipedia.org/w/api.php";
  const commonParams = "&format=json&origin=*";
  const properNounKeywords = ["人名", "俳優", "タレント", "ミュージシャン", "モデル", "声優", "アナウンサー", "スポーツ選手", "政治家", "歴史上の人物", "架空の人物", "地理", "都市", "国", "駅", "企業", "大学", "シングル", "アルバム", "テレビドラマ", "映画作品", "漫画作品", "アニメ作品", "ゲーム作品"];

  try {
    const params = `?action=query&generator=random&grnnamespace=0&grnlimit=20&prop=extracts|categories|pageviews${commonParams}`;
    const response = await fetch(url + params);
    const data = await response.json();

    if (!data.query || !data.query.pages) {
      throw new Error("APIから有効なデータが返されませんでした。");
    }

    const pages = Object.values(data.query.pages);
    let foundArticle = null;

    for (const page of pages) {
      // ▼▼▼ この一行を追加 ▼▼▼
      if (!page.extract) continue; // 本文(extract)が存在しない記事はスキップ
      // ▲▲▲ この一行を追加 ▲▲▲

      if (settings.excludeProperNouns) {
        const categories = page.categories?.map(cat => cat.title) || [];
        const isProperNoun = categories.some(cat => properNounKeywords.some(key => cat.includes(key)));
        if (isProperNoun) continue;
      }

      const pageviews = page.pageviews ? Object.values(page.pageviews).reduce((a, b) => a + b, 0) : 0;
      if (pageviews < settings.minPageviews) continue;
      
      foundArticle = page;
      break;
    }

    if (!foundArticle && pages.length > 0) {
      // フィルターを通過するものがなくても、本文がある最初の記事をフォールバックとして採用
      foundArticle = pages.find(p => p.extract) || pages[0];
    }
    
    if (foundArticle && foundArticle.extract) {
      const { maskedText, unmaskableWords } = maskText(foundArticle.extract, foundArticle.title);
      return {
        article: { title: foundArticle.title, extract: foundArticle.extract },
        maskedText,
        unmaskableWords
      };
    } else {
      throw new Error("表示できる記事が見つかりませんでした。");
    }

  } catch (error) {
    console.error("APIリクエスト中にエラー:", error);
    return null;
  }
};