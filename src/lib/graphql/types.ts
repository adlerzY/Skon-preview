export interface VariationCard {
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  imageUrl: string;
  attributes: Array<{ name: string; value: string; slug: string; flagUrl: string }>;
  giftPrice: string;
  giftRegularPrice?: string;
  codePrice: string;
  codeRegularPrice?: string;
  codeStockCount?: number;
  parsedPrice: number | null;
  parsedRegularPrice: number | null;
  parsedGiftPrice: number | "disabled";
  parsedGiftRegularPrice: number | "disabled";
  parsedCodePrice: number | "disabled";
  parsedCodeRegularPrice: number | "disabled";
  regionSlug?: string;
  currency?: string;
  currencySymbol?: string;
  gameDiscountPercent?: number;
  commissionDiscountPercent?: number;
  commissionDiscountBadge?: boolean;
  variationIdsByDelivery?: { direct?: number; gift?: number; code?: number };
}

export interface ContentMatrixColumn {
  key: string;
  label: string;
}

export interface ContentMatrixItem {
  name: string;
  includedIn: string[];
}

export interface ContentMatrix {
  columns: ContentMatrixColumn[];
  items: ContentMatrixItem[];
  image?: string | null;
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
  imageLarge?: { sourceUrl: string } | null;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  archivePricing?: {
    price?: string | null;
    regularPrice?: string | null;
    isAvailableInRegion?: boolean | null;
    commissionDiscountBadge?: boolean | null;
  } | null;
  parsedPrice: number | null;
  parsedRegularPrice: number | null;
  isAvailableInRegion?: boolean;
  commissionDiscountBadge?: boolean;
  variationCards?: VariationCard[];
  isVariation?: boolean;
  defaultVariationId?: number;
  defaultEdition?: string;
  activeRegion?: string;
  averageRating?: number;
  reviewCount?: number;
  contentMatrix?: ContentMatrix | null;
  reviews?: {
    pageInfo?: { hasNextPage: boolean; endCursor: string | null };
    nodes: Array<{
      id: string;
      databaseId?: number;
      parentDatabaseId?: number;
      isStaffReply?: boolean;
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
      categoryImage?: { sourceUrl: string } | null;
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

export interface HeroTabItem {
  tabLabel: string;
  heading: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl: string;
}