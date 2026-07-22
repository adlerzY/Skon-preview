export interface TocItem { id: string; text: string; level: 2 | 3; }

const PERSIAN_PUNCTUATION = /[\u060C\u061B\u061F\u066A-\u066C\u06D4]/g; // ، ؛ ؟ ٪ ٫ ٬ ۔

export function extractTocAndInjectIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  const slugify = (text: string, index: number) => {
    const base = text
      .replace(/<[^>]*>/g, "")
      .replace(/&[a-zA-Z#0-9]+;/g, " ")
      .trim()
      .replace(PERSIAN_PUNCTUATION, "")
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    let slug = base || `heading-${index}`;
    let suffix = 1;
    while (used.has(slug)) {
      slug = `${base || "heading"}-${suffix}`;
      suffix++;
    }
    used.add(slug);
    return slug;
  };

  let index = 0;
  const updatedHtml = html.replace(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text) return match;
    const id = slugify(text, index++);
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    const cleanAttrs = attrs.replace(/\sid=(["']).*?\1/gi, "");
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: updatedHtml, toc };
}