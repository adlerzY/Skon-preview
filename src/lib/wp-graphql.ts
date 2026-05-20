const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://tazavesh.local/graphql';

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
    }
  }
`;

export async function fetchGraphQL(query: string, variables: any = {}, tags: string[] = [], cacheMode: RequestCache = 'default') { 
  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    };

    if (cacheMode === 'no-store') {
      fetchOptions.cache = 'no-store';
    } else if (tags.length > 0) {
      fetchOptions.next = { tags };
    }

    const res = await fetch(WP_GRAPHQL_URL, fetchOptions);

    if (!res.ok) {
      throw new Error(`GraphQL HTTP Error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.errors) {
      console.error('❌ GraphQL Core Syntax/Schema Errors:', JSON.stringify(json.errors, null, 2));
      throw new Error('GraphQL Execution Error');
    }
    return json.data;
  } catch (error) {
    console.error('🚨 Network/Server Connection Refused on fetchGraphQL:', error);
    throw error;
  }
}

export const formatProducts = (products: any[]) => {
  return products.map(product => ({
    ...product,
    parsedPrice: parsePrice(product.price),
    parsedRegularPrice: parsePrice(product.regularPrice),
  }));
};

export async function getHeaderCategories() {
  try {
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

    const nodes: HeaderCategoryNode[] = data?.productCategories?.nodes || [];
    return nodes
      .filter((cat) => !["home", "uncategorized"].includes(cat.slug) && cat.image?.sourceUrl)
      .map((cat) => ({
        title: cat.name,
        img: cat.image!.sourceUrl,
        link: `/${cat.slug}`,
      }));
  } catch (e) {
    return [];
  }
}

export async function getProducts(categorySlug?: string) {
  try {
    const tags = categorySlug ? ['products', `category-${categorySlug}`] : ['products'];
    const data = await fetchGraphQL(`
      ${PRODUCT_CARD_FIELDS}
      query GetProducts($categoryIn: [String]) {
        products(first: 12, where: { categoryIn: $categoryIn, status: "PUBLISH" }) {
          nodes { ...ProductCardFields }
        }
      }
    `, categorySlug ? { categoryIn: [categorySlug] } : {}, tags); 
    
    return formatProducts(data?.products?.nodes || []);
  } catch (e) {
    return [];
  }
}

export async function getCategoryArchive(slug: string) {
  if (!slug) return null;
  try {
    const categoryAndProductsPromise = fetchGraphQL(`
      ${CATEGORY_BASIC_FIELDS}
      ${PRODUCT_CARD_FIELDS}
      query GetCategoryProducts($id: ID!) {
        productCategory(id: $id, idType: SLUG) {
          ...CategoryBasicFields
          products(first: 20, where: { status: "PUBLISH" }) {
            nodes { ...ProductCardFields }
          }
        }
      }
    `, { id: slug }, ['products', `category-${slug}`]); 

    const bannersPromise = fetchGraphQL(`
      ${BANNER_FIELDS}
      query GetCategoryBanners($id: ID!) {
        productCategory(id: $id, idType: SLUG) {
          banners { ...BannerFields }
        }
      }
    `, { id: slug }, ['banners', 'banners-' + slug]); 

    const [categoryData, bannersData] = await Promise.all([categoryAndProductsPromise, bannersPromise]);

    if (!categoryData?.productCategory) return null;

    return {
      ...categoryData.productCategory,
      banners: bannersData?.productCategory?.banners || [],
      products: {
        nodes: formatProducts(categoryData.productCategory.products?.nodes || [])
      }
    };
  } catch (e) {
    return null;
  }
}

export async function getHomePageData() {
  try {
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

    return {
      banners: data?.homeBanners?.banners || [],
      featured: formatProducts(data?.featuredProducts?.nodes || []),
      latest: formatProducts(data?.latestProducts?.nodes || [])
    };
  } catch (e) {
    return { banners: [], featured: [], latest: [] };
  }
}

export async function getHeaderBlogCategories() {
  try {
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

    const nodes: HeaderCategoryNode[] = data?.categories?.nodes || [];
    return nodes
      .filter((cat) => cat.categoryImage?.sourceUrl)
      .map((cat) => ({
        title: cat.name,
        img: cat.categoryImage!.sourceUrl, 
        link: `/blog/${cat.slug}/`,
      }));
  } catch (e) {
    return [];
  }
}

export async function getPostDetail(slug: string) {
  try {
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

    return data?.post;
  } catch (e) {
    return null;
  }
}