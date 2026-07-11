export interface VariationCard {
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  imageUrl: string;
  attributes: Array<{ name: string; value: string; slug: string; flagUrl: string }>;
  giftPriceToman: string;
  giftRegularPriceToman?: string;
  codePriceToman: string;
  codeRegularPriceToman?: string;
  parsedPrice?: number | null;
  parsedRegularPrice?: number | null;
  parsedGiftPrice?: number | "disabled";
  parsedGiftRegularPrice?: number | "disabled";
  parsedCodePrice?: number | "disabled";
  parsedCodeRegularPrice?: number | "disabled";
  regionSlug?: string;
}

export interface ProductNode {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  featured?: boolean;
  date?: string;
  shortDescription?: string;
  shortNotify?: string;
  secondaryGallery?: Array<{ description: string; imageUrl: string }> | null;
  description?: string;
  image?: { sourceUrl: string } | null;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  parsedPrice?: number | null;
  parsedRegularPrice?: number | null;
  variationCards?: VariationCard[];
  isVariation?: boolean;
  defaultVariationId?: number;
  defaultEdition?: string;
  activeRegion?: string;
  averageRating?: number;
  reviewCount?: number;
  reviews?: {
    nodes: Array<{
      id: string;
      content: string;
      date?: string;
      author?: { node?: { name?: string; avatarUrl?: string } };
    }>;
  };
  productCategories?: {
    nodes: Array<{
      name: string;
      slug: string;
      image?: { sourceUrl: string } | null;
    }>;
  };
  attributes?: {
    nodes: Array<{ name: string; options: string[] }>;
  };
  galleryImages?: {
    nodes: Array<{ sourceUrl: string }>;
  };
}

export interface HeaderCategoryNode {
  name: string;
  slug: string;
  image?: { sourceUrl: string } | null;
  categoryImage?: { sourceUrl: string } | null;
}