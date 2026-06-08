//متدهای کمکی مثل فرمت‌کننده محصولات برای آرشیو و سینگل
import { parsePrice } from './client';
import { ProductNode, VariationCard } from './types';

export const formatProducts = (products: ProductNode[], archiveMode: boolean = false): ProductNode[] => {
  const formattedProducts: ProductNode[] = [];

  products.forEach(product => {
    const rawVariations = product.variationCards || [];
    
    const parsedVariationCards = rawVariations.map((v: VariationCard) => {
      const pGift = (v.giftPriceToman === 'disabled' || !v.giftPriceToman ? 'disabled' : parsePrice(v.giftPriceToman) ?? 'disabled') as number | "disabled";
      const pGiftReg = (v.giftRegularPriceToman === 'disabled' || !v.giftRegularPriceToman ? 'disabled' : parsePrice(v.giftRegularPriceToman) ?? 'disabled') as number | "disabled";
      
      const pCode = (v.codePriceToman === 'disabled' || !v.codePriceToman ? 'disabled' : parsePrice(v.codePriceToman) ?? 'disabled') as number | "disabled";
      const pCodeReg = (v.codeRegularPriceToman === 'disabled' || !v.codeRegularPriceToman ? 'disabled' : parsePrice(v.codeRegularPriceToman) ?? 'disabled') as number | "disabled";

      return {
        ...v,
        parsedPrice: parsePrice(v.price),
        parsedRegularPrice: parsePrice(v.regularPrice),
        parsedGiftPrice: pGift,
        parsedGiftRegularPrice: pGiftReg,
        parsedCodePrice: pCode,
        parsedCodeRegularPrice: pCodeReg
      };
    });

    if (archiveMode && parsedVariationCards.length > 0) {
      const groupedVariations = new Map<string, typeof parsedVariationCards[0]>();
      
      parsedVariationCards.forEach(v => {
        const mainAttr = v.attributes && v.attributes.length > 0 ? v.attributes[0].value : 'بدون‌نسخه';
        
        if (!groupedVariations.has(mainAttr)) {
          groupedVariations.set(mainAttr, v);
        } else {
          const existing = groupedVariations.get(mainAttr)!;
          const currentPrice = v.parsedPrice || Infinity;
          const existingPrice = existing.parsedPrice || Infinity;
          if (currentPrice < existingPrice) {
            groupedVariations.set(mainAttr, v);
          }
        }
      });

      groupedVariations.forEach((representativeVar, attrValue) => {
        formattedProducts.push({
          ...product,
          id: `${product.id}-${representativeVar.databaseId}`,
          name: `${product.name} - ${attrValue}`,
          image: representativeVar.imageUrl ? { sourceUrl: representativeVar.imageUrl } : product.image,
          price: representativeVar.price,
          regularPrice: representativeVar.regularPrice,
          salePrice: representativeVar.salePrice,
          parsedPrice: representativeVar.parsedPrice, 
          parsedRegularPrice: representativeVar.parsedRegularPrice,
          variationCards: [], 
          isVariation: true,
          defaultVariationId: representativeVar.databaseId,
          slug: `${product.slug}?edition=${encodeURIComponent(attrValue)}` 
        });
      });
    } else {
      const firstVarPrice = parsedVariationCards.length > 0 ? parsedVariationCards[0].parsedPrice : null;
      const firstVarRegularPrice = parsedVariationCards.length > 0 ? parsedVariationCards[0].parsedRegularPrice : null;

      formattedProducts.push({
        ...product,
        parsedPrice: product.variationCards && product.variationCards.length > 0 ? firstVarPrice : parsePrice(product.price),
        parsedRegularPrice: product.variationCards && product.variationCards.length > 0 ? firstVarRegularPrice : parsePrice(product.regularPrice),
        variationCards: parsedVariationCards,
        isVariation: parsedVariationCards.length > 0
      });
    }
  });

  return formattedProducts;
};