const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://tazavesh.local/graphql';

export interface VariationCard {
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  imageUrl: string;
  attributes: Array<{ name: string; value: string }>;
  giftPriceToman: string;
  giftRegularPriceToman?: string;
  codePriceToman: string;
  codeRegularPriceToman?: string;
  parsedPrice?: number | null;
  parsedRegularPrice?: number | null;
  parsedGiftPrice?: number | 'disabled';
  parsedGiftRegularPrice?: number | 'disabled';
  parsedCodePrice?: number | 'disabled';
  parsedCodeRegularPrice?: number | 'disabled';
}

export interface ProductNode {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  featured?: boolean;
  date?: string;
  shortDescription?: string;
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
  productCategories?: {
    nodes: Array<{
      name: string;
      slug: string;
      image?: { sourceUrl: string } | null;
    }>;
  };
  attributes?: any;
  galleryImages?: any;
}

export interface HeaderCategoryNode {
  name: string;
  slug: string;
  image?: {
    sourceUrl: string;
  } | null;
  categoryImage?: {
    sourceUrl: string;
  } | null;
}

const parsePrice = (priceString?: string | null): number | null => {
  if (!priceString) return null;
  const splitString = String(priceString).split(/[-–—]|&ndash;/)[0];
  const englishNumbers = splitString
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const numericString = englishNumbers.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : null;
};

// فرگمنت اصلاح شده با فیلدهای جدید ریگولار
export const PRODUCT_CARD_FIELDS = `
  fragment ProductCardFields on Product {
    id
    databaseId
    name
    slug
    featured
    date
    shortDescription
    image {
      sourceUrl(size: MEDIUM)
    }
    productCategories(first: 1) {
      nodes {
        name
        slug
        image {
          sourceUrl(size: THUMBNAIL)
        }
      }
    }
    ... on SimpleProduct {
      price
      regularPrice
      salePrice
    }
    ... on VariableProduct {
      price
      regularPrice
      salePrice
      variationCards {
        databaseId
        name
        slug
        price
        regularPrice
        salePrice
        imageUrl
        giftPriceToman
        giftRegularPriceToman
        codePriceToman
        codeRegularPriceToman
        attributes {
          name
          value
        }
      }
    }
  }
`;

export const BANNER_FIELDS = `
  fragment BannerFields on CategoryBannerItem {
    title
    subtitle
    imageUrl
    link
  }
`;

export const CATEGORY_BASIC_FIELDS = `
  fragment CategoryBasicFields on ProductCategory {
    name
    slug
    image {
      sourceUrl(size: THUMBNAIL)
    }
  }
`;

export async function fetchGraphQL(query: string, variables: any = {}, tags: string[] = [], cacheMode: RequestCache = 'default') { 
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: cacheMode === 'no-store' ? 'no-store' : 'force-cache'
  };

  if (cacheMode !== 'no-store' && tags.length > 0) {
    const safeTags = tags.map(tag => encodeURIComponent(tag));
    fetchOptions.next = { tags: safeTags };
  }

  const res = await fetch(WP_GRAPHQL_URL, fetchOptions);

  if (!res.ok) {
    throw new Error(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  
  if (json.errors) {
    console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL Execution Error');
  }
  
  return json.data;
}

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
      formattedProducts.push({
        ...product,
        parsedPrice: parsePrice(product.price),
        parsedRegularPrice: parsePrice(product.regularPrice),
        variationCards: parsedVariationCards,
        isVariation: parsedVariationCards.length > 0
      });
    }
  });

  return formattedProducts;
};

export async function getHeaderCategories() {
  const data = await fetchGraphQL(
    `
      ${CATEGORY_BASIC_FIELDS}
      query GetHeaderCategories {
        productCategories(where: { hideEmpty: true, parent: 0 }, first: 15) {
          nodes {
            ...CategoryBasicFields
          }
        }
      }
    `,
    {},
    ["header-data"]
  );

  if (!data?.productCategories?.nodes) return [];

  const nodes: HeaderCategoryNode[] = data.productCategories.nodes;
  return nodes
    .filter((cat) => !["home", "uncategorized"].includes(cat.slug) && cat.image?.sourceUrl)
    .map((cat) => ({
      title: cat.name,
      img: cat.image!.sourceUrl,
      link: `/${cat.slug}`,
    }));
}

export async function getProducts(categorySlug?: string) {
  const tags = categorySlug ? ['products', `category-${categorySlug}`] : ['products'];
  const data = await fetchGraphQL(`
    ${PRODUCT_CARD_FIELDS}
    query GetProducts($categoryIn: [String]) {
      products(first: 12, where: { categoryIn: $categoryIn, status: "PUBLISH" }) {
        nodes { ...ProductCardFields }
      }
    }
  `, categorySlug ? { categoryIn: [categorySlug] } : {}, tags); 
  
  if (!data?.products?.nodes) return [];

  return formatProducts(data.products.nodes, true);
}

export async function getCategoryArchive(slug: string) {
  if (!slug) return null;
  
  const categoryAndProductsPromise = fetchGraphQL(`
    ${CATEGORY_BASIC_FIELDS}
    ${PRODUCT_CARD_FIELDS}
    query GetCategoryProducts($id: ID!, $categoryIn: [String]) {
      productCategory(id: $id, idType: SLUG) {
        ...CategoryBasicFields
      }
      products(first: 20, where: { categoryIn: $categoryIn, status: "PUBLISH" }) {
        nodes { ...ProductCardFields }
      }
    }
  `, { id: slug, categoryIn: [slug] }, ['products', `category-${slug}`]); 

  const bannersPromise = fetchGraphQL(`
    ${BANNER_FIELDS}
    query GetCategoryBanners($id: ID!) {
      productCategory(id: $id, idType: SLUG) {
        banners { ...BannerFields }
      }
    }
  `, { id: slug }, ['banners', `banners-${slug}`]); 

  const [categoryData, bannersData] = await Promise.all([categoryAndProductsPromise, bannersPromise]);

  if (!categoryData?.productCategory) return null;

  return {
    ...categoryData.productCategory,
    banners: bannersData?.productCategory?.banners || [],
    products: {
      nodes: formatProducts(categoryData.products?.nodes || [], true)
    }
  };
}

export async function getHomePageData() {
  const data = await fetchGraphQL(`
    ${PRODUCT_CARD_FIELDS}
    ${BANNER_FIELDS}
    query GetHomePage {
      homeBanners: productCategory(id: "home", idType: SLUG) {
        banners {
          ...BannerFields
        }
      }
      featuredProducts: products(first: 12, where: { featured: true, status: "PUBLISH" }) {
        nodes {
          ...ProductCardFields
        }
      }
      latestProducts: products(first: 10, where: { status: "PUBLISH", orderby: { field: DATE, order: DESC } }) {
        nodes {
          ...ProductCardFields
        }
      }
    }
  `, {}, ['products', 'banners', 'home']); 

  if (!data) {
    return { banners: [], featured: [], latest: [] };
  }

  return {
    banners: data.homeBanners?.banners || [],
    featured: formatProducts(data.featuredProducts?.nodes || [], true),
    latest: formatProducts(data.latestProducts?.nodes || [], true)
  };
}

export async function getHeaderBlogCategories() {
  const data = await fetchGraphQL(
    `
      query GetBlogCategories {
        categories(where: { hideEmpty: true, parent: 0 }, first: 15) {
          nodes {
            name
            slug
            categoryImage {
              sourceUrl(size: "thumbnail")
            }
          }
        }
      }
    `,
    {},
    ["header-data"]
  );

  if (!data?.categories?.nodes) return [];

  const nodes: HeaderCategoryNode[] = data.categories.nodes;
  return nodes
    .filter((cat) => cat.categoryImage?.sourceUrl)
    .map((cat) => ({
      title: cat.name,
      img: cat.categoryImage!.sourceUrl, 
      link: `/blog/${cat.slug}/`,
    }));
}

export async function getPostDetail(slug: string) {
  if (!slug) return null;

  const data = await fetchGraphQL(`
    query GetPostDetail($id: ID!) {
      post(id: $id, idType: SLUG) {
        title
        content
        date
        featuredImage {
          node {
            sourceUrl(size: LARGE)
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        author {
          node {
            name
          }
        }
      }
    }
  `, { id: slug }, [`post-${slug}`]);

  if (!data?.post) return null;

  return data.post;
}

export async function getProductDetail(slug: string) {
  if (!slug) return null;

  const data = await fetchGraphQL(`
    ${PRODUCT_CARD_FIELDS}
    query GetProductDetail($id: ID!) {
      product(id: $id, idType: SLUG) {
        ...ProductCardFields
        description
        galleryImages {
          nodes {
            sourceUrl(size: LARGE)
          }
        }
        attributes {
          nodes {
            name
            options
          }
        }
      }
    }
  `, { id: slug }, [`product-${slug}`]);

  if (!data?.product) return null;

  const formatted = formatProducts([data.product], false);
  return formatted[0];
}