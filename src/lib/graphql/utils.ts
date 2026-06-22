import { parsePrice } from './client';
import { ProductNode, VariationCard } from './types';

export const formatProducts = (
  products: ProductNode[], 
  archiveMode: boolean = false, 
  activeRegion: string = 'eu'
): ProductNode[] => {
  const formattedProducts: ProductNode[] = [];

  products.forEach(product => {
    const rawVariations = product.variationCards || [];

    const parsedVariationCards = rawVariations.map((v: any) => {
      const pGift = (v.giftPriceToman === 'disabled' || !v.giftPriceToman
        ? 'disabled'
        : parsePrice(v.giftPriceToman) ?? 'disabled') as number | "disabled";

      const pGiftReg = (v.giftRegularPriceToman === 'disabled' || !v.giftRegularPriceToman
        ? 'disabled'
        : parsePrice(v.giftRegularPriceToman) ?? 'disabled') as number | "disabled";

      const pCode = (v.codePriceToman === 'disabled' || !v.codePriceToman
        ? 'disabled'
        : parsePrice(v.codePriceToman) ?? 'disabled') as number | "disabled";

      const pCodeReg = (v.codeRegularPriceToman === 'disabled' || !v.codeRegularPriceToman
        ? 'disabled'
        : parsePrice(v.codeRegularPriceToman) ?? 'disabled') as number | "disabled";

      return {
        ...v,
        parsedPrice: parsePrice(v.price),
        parsedRegularPrice: parsePrice(v.regularPrice),
        parsedGiftPrice: pGift,
        parsedGiftRegularPrice: pGiftReg,
        parsedCodePrice: pCode,
        parsedCodeRegularPrice: pCodeReg,
      };
    });

    if (archiveMode && parsedVariationCards.length > 0) {
      const regionFilteredVariations = parsedVariationCards.filter(
        v => v.regionSlug?.toLowerCase() === activeRegion.toLowerCase()
      );

      if (regionFilteredVariations.length === 0) return;

      const groupedVariations = new Map<string, typeof regionFilteredVariations[0]>();

      regionFilteredVariations.forEach(v => {
        const editionAttr = v.attributes?.find((a: any) => {
          const cleanName = a.name?.replace('pa_', '').replace('attribute_', '').toLowerCase() || '';
          return !cleanName.includes('region') && !cleanName.includes('ریجن');
        })?.value || 'نسخه اصلی';

        if (!groupedVariations.has(editionAttr)) {
          groupedVariations.set(editionAttr, v);
        } else {
          const existing = groupedVariations.get(editionAttr)!;
          const currentPrice = v.parsedPrice || Infinity;
          const existingPrice = existing.parsedPrice || Infinity;
          if (currentPrice < existingPrice) {
            groupedVariations.set(editionAttr, v);
          }
        }
      });

      groupedVariations.forEach((representativeVar, editionValue) => {
        const validPrices = [
          representativeVar.parsedPrice,
          representativeVar.parsedGiftPrice,
          representativeVar.parsedCodePrice
        ].filter(p => p !== null && p !== undefined && p !== 'disabled') as number[];

        const currentMinPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

        formattedProducts.push({
          ...product,
          id: `${product.id}-${representativeVar.databaseId}`,
          name: `${product.name} - ${editionValue}`,
          image: representativeVar.imageUrl
            ? { sourceUrl: representativeVar.imageUrl }
            : product.image,
          price: representativeVar.price,
          regularPrice: representativeVar.regularPrice,
          salePrice: representativeVar.salePrice,
          parsedPrice: currentMinPrice, 
          parsedRegularPrice: representativeVar.parsedRegularPrice,
          variationCards: regionFilteredVariations, 
          isVariation: true,
          defaultVariationId: representativeVar.databaseId,
          slug: product.slug,
          defaultEdition: editionValue,
          activeRegion: activeRegion 
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
            isVariation: parsedVariationCards.length > 0,
          });
    }
  });

  return formattedProducts;
};