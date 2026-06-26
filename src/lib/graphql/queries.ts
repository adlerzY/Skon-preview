import { fetchGraphQL } from './client';
import { formatProducts } from './utils';
import { HeaderCategoryNode, ProductNode } from './types';
import { CATEGORY_BASIC_FIELDS, PRODUCT_CARD_FIELDS, BANNER_FIELDS } from './fragments';

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

export async function getProducts(categorySlug?: string, activeRegion: string = 'eu') {
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

  return formatProducts(data.products.nodes, true, activeRegion);
}

export async function getCategoryArchive(slug: string, activeRegion: string = 'eu') {
  if (!slug) return null;
  
  const categoryAndProductsPromise = fetchGraphQL(`
    ${CATEGORY_BASIC_FIELDS}
    ${PRODUCT_CARD_FIELDS}
    query GetCategoryProducts($id: ID!, $categoryIn: [String]) {
      productCategory(id: $id, idType: SLUG) {
        ...CategoryBasicFields
        children(where: { hideEmpty: true }) {
          nodes {
            id
            databaseId
            name
            slug
          }
        }
      }
      products(first: 100, where: { categoryIn: $categoryIn, status: "PUBLISH" }) {
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

  const safeBanners = (bannersData?.productCategory?.banners || []).map((banner: any) => ({
    ...banner,
    imageUrl: banner.imageUrl ? encodeURI(banner.imageUrl) : '',
    secondimage: banner.secondimage ? encodeURI(banner.secondimage) : '',
  }));

  return {
    ...categoryData.productCategory,
    banners: safeBanners,
    products: {
      nodes: formatProducts(categoryData.products?.nodes || [], true, activeRegion)
    }
  };
}

export async function getHomePageData(activeRegion: string = 'eu') {
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
  `, 
  {}, 
  ['products', 'banners', 'home'],
  { type: 'no-store' }
  ); 

  if (!data) {
    return { banners: [], featured: [], latest: [] };
  }

  const safeBanners = (data.homeBanners?.banners || []).map((banner: any) => ({
    ...banner,
    imageUrl: banner.imageUrl ? encodeURI(banner.imageUrl) : '',
    secondimage: banner.secondimage ? encodeURI(banner.secondimage) : '',
  }));

  return {
    banners: safeBanners,
    featured: formatProducts(data.featuredProducts?.nodes || [], true, activeRegion),
    latest: formatProducts(data.latestProducts?.nodes || [], true, activeRegion)
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
        secondaryGallery {
          description
          imageUrl
        }
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

export async function getRegions() {
  const data = await fetchGraphQL(
    `
      query GetRegions {
        allPaRegionShop(first: 10) {
          nodes {
            name
            title
            slug
            flagUrl
          }
        }
      }
    `,
    {},
    ["regions"]
  );

  if (!data?.allPaRegionShop?.nodes) return [];

  return data.allPaRegionShop.nodes.map((r: any) => ({
    name: r.name || r.title,
    slug: r.slug,
    flagUrl: r.flagUrl || undefined,
  }));
}