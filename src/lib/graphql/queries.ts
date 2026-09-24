import "server-only";
import crypto from "node:crypto";
import { unstable_cache } from "next/cache";
import { fetchGraphQL } from "./client";
import { formatProducts, sanitizeHtml } from "./utils";
import { extractTocAndInjectIds } from "@/lib/blogToc";
import { HeaderCategoryNode, HeroTabItem, ProductNode } from "./types";
import {
  CATEGORY_BASIC_FIELDS,
  PRODUCT_CARD_FIELDS,
  BANNER_FIELDS,
  HERO_TAB_FIELDS,
  CATEGORY_WITH_CHILDREN_FIELDS,
} from "./fragments";

interface Banner {
  title: string;
  secondimage: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

function safeBannerUrls(banners: Banner[]): Banner[] {
  return banners.map((b) => ({
    ...b,
    imageUrl: b.imageUrl ? encodeURI(b.imageUrl) : "",
    secondimage: b.secondimage ? encodeURI(b.secondimage) : "",
  }));
}

function safeHeroTabUrls(tabs: HeroTabItem[]): HeroTabItem[] {
  return tabs.map((t) => ({
    ...t,
    imageUrl: t.imageUrl ? encodeURI(t.imageUrl) : "",
  }));
}

function buildSlugTag(prefix: string, slug: string): string {
  let normalized = slug;
  try {
    normalized = decodeURIComponent(slug);
  } catch {
    normalized = slug;
  }

  const asciiPart = normalized
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const hash = crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 16);

  return asciiPart ? `${prefix}-${asciiPart}-${hash}` : `${prefix}-${hash}`;
}


async function loadHeaderPublicNavigationData() {
  const data = await fetchGraphQL(
    `
      ${CATEGORY_BASIC_FIELDS}
      query GetHeaderPublicNavigationData {
        productCategories(where: { hideEmpty: true, parent: 0 }, first: 15) {
          nodes { ...CategoryBasicFields }
        }
        categories(where: { hideEmpty: true, parent: 0 }, first: 15) {
          nodes {
            name
            slug
            categoryImage { sourceUrl(size: "thumbnail") }
          }
        }
      }
    `,
    {},
    ["header-data"]
  );

  const shopNodes: HeaderCategoryNode[] = data?.productCategories?.nodes ?? [];
  const blogNodes: HeaderCategoryNode[] = data?.categories?.nodes ?? [];

  return {
    shopItems: shopNodes
      .filter((cat) => !["home", "uncategorized"].includes(cat.slug) && cat.image?.sourceUrl)
      .map((cat) => ({
        title: cat.name,
        img: cat.image!.sourceUrl,
        link: `/${cat.slug}`,
      })),
    blogItems: blogNodes
      .filter((cat) => cat.categoryImage?.sourceUrl)
      .map((cat) => ({
        title: cat.name,
        img: cat.categoryImage!.sourceUrl,
        link: `/blog/${cat.slug}`,
      })),
  };
}

export async function getHeaderPublicNavigationData() {
  const cached = unstable_cache(
    loadHeaderPublicNavigationData,
    ["header-public-navigation-data"],
    { tags: ["header-data"], revalidate: false }
  );

  return cached();
}

async function loadHeaderRegionsData() {
  const data = await fetchGraphQL(
    `
      query GetHeaderRegionsData {
        allPaRegionShop(first: 10) {
          nodes { name title slug flagUrl }
        }
      }
    `,
    {},
    ["regions"]
  );

  const regions = Array.isArray(data?.allPaRegionShop?.nodes)
    ? data.allPaRegionShop.nodes.map((r: Record<string, string>) => ({
        name: r.name || r.title,
        slug: r.slug,
        flagUrl: r.flagUrl || undefined,
      }))
    : [];

  return { regions };
}

export async function getHeaderRegionsData() {
  const cached = unstable_cache(
    loadHeaderRegionsData,
    ["header-regions-data"],
    { tags: ["regions"], revalidate: false }
  );

  return cached();
}

/**
 * Backwards-compatible combined accessor for callers outside the Header.
 * The Header itself deliberately uses the split accessors so public navigation
 * and region data can stream independently.
 */
export async function getHeaderNavigationData() {
  const [navigation, regionData] = await Promise.all([
    getHeaderPublicNavigationData(),
    getHeaderRegionsData(),
  ]);

  return { ...navigation, ...regionData };
}

export async function getHeaderCategories() {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${CATEGORY_BASIC_FIELDS}
          query GetHeaderCategories {
            productCategories(where: { hideEmpty: true, parent: 0 }, first: 15) {
              nodes { ...CategoryBasicFields }
            }
          }
        `,
        {},
        ["header-data"]
      );

      const nodes: HeaderCategoryNode[] = data?.productCategories?.nodes ?? [];
      return nodes
        .filter((cat) => !["home", "uncategorized"].includes(cat.slug) && cat.image?.sourceUrl)
        .map((cat) => ({
          title: cat.name,
          img: cat.image!.sourceUrl,
          link: `/${cat.slug}`,
        }));
    },
    ["header-categories"],
    { tags: ["header-data"], revalidate: false }
  );

  return cached();
}

export async function getProducts(categorySlug?: string, activeRegion: string = "eu") {
  const tags = categorySlug
    ? ["products", buildSlugTag("category", categorySlug)]
    : ["products"];

  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${PRODUCT_CARD_FIELDS}
          query GetProducts($categoryIn: [String], $regionSlug: String) {
            products(first: 12, where: { categoryIn: $categoryIn, status: "PUBLISH", regionSlug: $regionSlug }) {
              nodes { ...ProductCardFields }
            }
          }
        `,
        categorySlug ? { categoryIn: [categorySlug], regionSlug: activeRegion } : { regionSlug: activeRegion },
        tags
      );

      return formatProducts(data?.products?.nodes ?? [], true, activeRegion).filter(
        (p) => p.isAvailableInRegion !== false
      );
    },
    ["get-products", categorySlug ?? "all", activeRegion],
    { tags, revalidate: false }
  );

  return cached();
}

export async function getCategoryShell(slug: string) {
  if (!slug) return null;

  const categoryTag = buildSlugTag("category", slug);
  const bannersTag = buildSlugTag("banners", slug);

  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${CATEGORY_BASIC_FIELDS}
          ${BANNER_FIELDS}
          query GetCategoryShell($id: ID!) {
            productCategory(id: $id, idType: SLUG) {
              ...CategoryBasicFields
              children(where: { hideEmpty: true }) {
                nodes { id databaseId name slug }
              }
              banners { ...BannerFields }
            }
          }
        `,
        { id: slug },
        ["banners", bannersTag, "header-data"]
      );

      if (data === null) {
        throw new Error(`دریافت اطلاعات دسته‌بندی «${slug}» با خطا مواجه شد`);
      }

      if (!data?.productCategory) return null;

      return {
        ...data.productCategory,
        banners: safeBannerUrls(data.productCategory.banners ?? []),
      };
    },
    ["category-shell", slug],
    { tags: ["banners", bannersTag, "header-data", categoryTag], revalidate: false }
  );

  return cached();
}

export async function getCategoryProducts(slug: string, activeRegion: string = "eu") {
  if (!slug) return [] as ProductNode[];

  const categoryTag = buildSlugTag("category", slug);

  const cached = unstable_cache(
    async () => {
      const collected: ProductNode[] = [];
      let after: string | null = null;
      let page = 0;

      do {
        const data = await fetchGraphQL(
          `
            ${PRODUCT_CARD_FIELDS}
            query GetCategoryProducts($categoryIn: [String], $regionSlug: String, $after: String) {
              products(first: 100, after: $after, where: { categoryIn: $categoryIn, status: "PUBLISH", regionSlug: $regionSlug }) {
                pageInfo { hasNextPage endCursor }
                nodes { ...ProductCardFields }
              }
            }
          `,
          { categoryIn: [slug], regionSlug: activeRegion, after },
          ["products", categoryTag],
          "no-store"
        );

        if (data === null) {
          throw new Error(`دریافت محصولات دسته‌بندی «${slug}» با خطا مواجه شد`);
        }

        collected.push(...(data.products?.nodes ?? []));
        const pageInfo = data.products?.pageInfo;
        if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
        after = pageInfo.endCursor;
        page += 1;
      } while (page < 50);

      return formatProducts(collected, true, activeRegion).filter(
        (p) => p.isAvailableInRegion !== false
      );
    },
    ["category-products", slug, activeRegion],
    { tags: ["products", categoryTag], revalidate: false }
  );

  return cached();
}

export async function getHomeHeroData() {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${BANNER_FIELDS}
          ${HERO_TAB_FIELDS}
          query GetHomeHero {
            homeBanners: productCategory(id: "home", idType: SLUG) {
              banners { ...BannerFields }
              heroTabs { ...HeroTabFields }
            }
          }
        `,
        {},
        ["banners", "home"],
        "force-cache"
      );

      if (!data) {
        return { banners: [], heroTabs: [] as HeroTabItem[] };
      }

      return {
        banners: safeBannerUrls(data.homeBanners?.banners ?? []),
        heroTabs: safeHeroTabUrls(data.homeBanners?.heroTabs ?? []),
      };
    },
    ["home-hero-data"],
    { tags: ["banners", "home"], revalidate: false }
  );

  return cached();
}

export async function getHomeFeaturedProducts(activeRegion: string = "eu") {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${PRODUCT_CARD_FIELDS}
          query GetHomeFeatured($regionSlug: String) {
            featuredProducts: products(first: 12, where: { featured: true, status: "PUBLISH", regionSlug: $regionSlug }) {
              nodes { ...ProductCardFields }
            }
          }
        `,
        { regionSlug: activeRegion },
        ["products", "home", "home-featured"],
        { type: "revalidate", seconds: 1800 }
      );

      if (!data) return [] as ProductNode[];

      return formatProducts(
        data.featuredProducts?.nodes ?? [],
        true,
        activeRegion
      ).filter((p) => p.isAvailableInRegion !== false);
    },
    ["home-featured-products", activeRegion],
    { tags: ["products", "home", "home-featured"], revalidate: 1800 }
  );

  return cached();
}

export async function getHomeLatestProducts(activeRegion: string = "eu") {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${PRODUCT_CARD_FIELDS}
          query GetHomeLatest($regionSlug: String) {
            latestProducts: products(first: 10, where: { status: "PUBLISH", orderby: { field: DATE, order: DESC }, regionSlug: $regionSlug }) {
              nodes { ...ProductCardFields }
            }
          }
        `,
        { regionSlug: activeRegion },
        ["products", "home", "home-latest"],
        { type: "revalidate", seconds: 1800 }
      );

      if (!data) return [] as ProductNode[];

      return formatProducts(
        data.latestProducts?.nodes ?? [],
        true,
        activeRegion
      ).filter((p) => p.isAvailableInRegion !== false);
    },
    ["home-latest-products", activeRegion],
    { tags: ["products", "home", "home-latest"], revalidate: 1800 }
  );

  return cached();
}

export async function getHeaderBlogCategories() {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          query GetBlogCategories {
            categories(where: { hideEmpty: true, parent: 0 }, first: 15) {
              nodes {
                name
                slug
                categoryImage { sourceUrl(size: "thumbnail") }
              }
            }
          }
        `,
        {},
        ["header-data"]
      );

      const nodes: HeaderCategoryNode[] = data?.categories?.nodes ?? [];
      return nodes
        .filter((cat) => cat.categoryImage?.sourceUrl)
        .map((cat) => ({
          title: cat.name,
          img: cat.categoryImage!.sourceUrl,
          link: `/blog/${cat.slug}`,
        }));
    },
    ["header-blog-categories"],
    { tags: ["header-data"], revalidate: false }
  );

  return cached();
}

export async function getPostDetail(slug: string) {
  if (!slug) return null;

  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          query GetPostDetail($id: ID!) {
            post(id: $id, idType: SLUG) {
              databaseId
              title
              content
              excerpt
              date
              commentsCount
              averageRating
              ratingCount
              featuredImage { node { sourceUrl } }
              categories {
                nodes {
                  databaseId
                  name
                  slug
                  categoryImage { sourceUrl(size: "thumbnail") }
                  parent { node { databaseId name slug } }
                }
              }
              tags {
                nodes { databaseId name slug }
              }
              author { node { name } }
            }
          }
        `,
        { id: slug },
        [`post-${slug}`]
      );

      if (data === null) {
        throw new Error(`دریافت اطلاعات مقاله «${slug}» با خطا مواجه شد`);
      }

      if (!data.post) return null;

      const sanitized = sanitizeHtml(data.post.content) ?? "";
      const { html, toc } = extractTocAndInjectIds(sanitized);

      return {
        ...data.post,
        content: html,
        toc,
        excerpt: sanitizeHtml(data.post.excerpt) ?? "",
      };
    },
    ["post-detail", slug],
    { tags: [`post-${slug}`], revalidate: false }
  );

  return cached();
}

export async function getRelatedPosts(params: {
  categoryId: number;
  categorySlug: string;
  parentCategoryId?: number | null;
  parentCategorySlug?: string | null;
  excludeId: number;
  first?: number;
}) {
  const { categoryId, categorySlug, parentCategoryId, parentCategorySlug, excludeId, first = 6 } = params;

  const tags = [
    `blog-category-${categorySlug}`,
    ...(parentCategorySlug ? [`blog-category-${parentCategorySlug}`] : []),
  ];

  const cached = unstable_cache(
    async () => {
      const primary = await fetchGraphQL(
        `
          query GetRelatedPosts($categoryIn: [ID], $notIn: [ID], $first: Int) {
            posts(first: $first, where: { categoryIn: $categoryIn, notIn: $notIn, orderby: { field: DATE, order: DESC } }) {
              nodes {
                id databaseId title slug date
                featuredImage { node { sourceUrl } }
                categories(first: 1) { nodes { slug } }
              }
            }
          }
        `,
        { categoryIn: [categoryId], notIn: [excludeId], first },
        [`blog-category-${categorySlug}`]
      );

      let posts = primary?.posts?.nodes ?? [];

      if (posts.length < first && parentCategoryId && parentCategorySlug) {
        const already = [excludeId, ...posts.map((p: any) => p.databaseId)];
        const secondary = await fetchGraphQL(
          `
            query GetMoreRelatedPosts($categoryIn: [ID], $notIn: [ID], $first: Int) {
              posts(first: $first, where: { categoryIn: $categoryIn, notIn: $notIn, orderby: { field: DATE, order: DESC } }) {
                nodes {
                  id databaseId title slug date
                  featuredImage { node { sourceUrl } }
                  categories(first: 1) { nodes { slug } }
                }
              }
            }
          `,
          { categoryIn: [parentCategoryId], notIn: already, first: first - posts.length },
          [`blog-category-${parentCategorySlug}`]
        );
        posts = [...posts, ...(secondary?.posts?.nodes ?? [])];
      }

      return posts;
    },
    ["related-posts", String(categoryId), String(parentCategoryId ?? ""), String(excludeId), String(first)],
    { tags, revalidate: false }
  );

  return cached();
}

const PRODUCT_DETAIL_CONTENT_QUERY = `
  query GetProductDetailContent($id: ID!) {
    product(id: $id, idType: SLUG) {
      id
      databaseId
      name
      slug
      featured
      date
      shortDescription
      shortNotify

      image { sourceUrl(size: MEDIUM) }
      imageLarge: image { sourceUrl(size: LARGE) }

      productCategories(first: 10) {
        nodes {
          name
          slug
          image { sourceUrl(size: THUMBNAIL) }
          categoryImage { sourceUrl(size: "thumbnail") }
        }
      }

      description
      secondaryGallery { description imageUrl }
      galleryImages { nodes { sourceUrl(size: LARGE) } }
      attributes { nodes { name options } }
      averageRating
      reviewCount
      contentMatrix {
        columns { key label }
        items { name includedIn }
        image
      }
    }
  }
`;

const PRODUCT_DETAIL_PRICING_QUERY = `
  query GetProductDetailPricing($id: ID!) {
    product(id: $id, idType: SLUG) {
      databaseId

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
          regionSlug

          giftPriceToman
          giftRegularPriceToman

          codePriceToman
          codeRegularPriceToman
          codeStockCount

          attributes {
            name
            taxonomy
            value
            slug
            flagUrl
          }
        }
      }
    }
  }
`;

interface ProductPricingSlice {
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  parsedPrice: number | null;
  parsedRegularPrice: number | null;
  variationCards: ProductNode["variationCards"];
  isVariation: boolean;
  isAvailableInRegion: boolean;
}

const EMPTY_PRICING_SLICE: ProductPricingSlice = {
  parsedPrice: null,
  parsedRegularPrice: null,
  variationCards: [],
  isVariation: false,
  isAvailableInRegion: false,
};

async function getProductDetailContent(slug: string) {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        PRODUCT_DETAIL_CONTENT_QUERY,
        { id: slug },
        [`product-${slug}`]
      );

      if (data === null) {
        throw new Error(`دریافت اطلاعات محصول «${slug}» با خطا مواجه شد`);
      }

      if (!data.product) return null;

      const product = data.product;

      return {
        ...product,
        shortDescription: sanitizeHtml(product.shortDescription),
        description: sanitizeHtml(product.description),
        secondaryGallery: product.secondaryGallery
          ? product.secondaryGallery.map(
              (item: { description?: string; imageUrl?: string }) => ({
                ...item,
                description:
                  sanitizeHtml(item.description) ?? item.description,
              })
            )
          : product.secondaryGallery,
      };
    },
    ["product-detail-content", slug],
    { tags: [`product-${slug}`], revalidate: false }
  );

  return cached();
}

async function getProductDetailPricing(
  slug: string,
  activeRegion: string
): Promise<ProductPricingSlice | null> {
  const cached = unstable_cache(
    async (): Promise<ProductPricingSlice | null> => {
      const data = await fetchGraphQL(
        PRODUCT_DETAIL_PRICING_QUERY,
        { id: slug },
        [`product-pricing-${slug}`]
      );

      if (data === null) {
        throw new Error(`دریافت قیمت محصول «${slug}» با خطا مواجه شد`);
      }

      if (!data.product) return null;

      const formatted = formatProducts(
        [data.product],
        false,
        activeRegion
      )[0];

      if (!formatted) return null;

      return {
        price: formatted.price,
        regularPrice: formatted.regularPrice,
        salePrice: formatted.salePrice,
        parsedPrice: formatted.parsedPrice ?? null,
        parsedRegularPrice: formatted.parsedRegularPrice ?? null,
        variationCards: formatted.variationCards ?? [],
        isVariation: Boolean(formatted.isVariation),
        isAvailableInRegion:
          formatted.isAvailableInRegion !== false,
      };
    },
    ["product-detail-pricing", slug, activeRegion],
    {
      tags: [`product-pricing-${slug}`],
      revalidate: false,
    }
  );

  return cached();
}

export async function getProductDetail(
  slug: string,
  activeRegion: string = "eu"
): Promise<ProductNode | null> {
  if (!slug) return null;

  const [content, pricing] = await Promise.all([
    getProductDetailContent(slug),
    getProductDetailPricing(slug, activeRegion),
  ]);

  if (!content) return null;

  return {
    ...content,
    ...(pricing ?? EMPTY_PRICING_SLICE),
  } as ProductNode;
}

export async function getRegions() {
  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          query GetRegions {
            allPaRegionShop(first: 10) {
              nodes { name title slug flagUrl }
            }
          }
        `,
        {},
        ["regions"]
      );

      if (!data?.allPaRegionShop?.nodes) {
        console.error("getRegions: no data returned");
        return [];
      }

      return data.allPaRegionShop.nodes.map((r: Record<string, string>) => ({
        name: r.name || r.title,
        slug: r.slug,
        flagUrl: r.flagUrl || undefined,
      }));
    },
    ["regions"],
    { tags: ["regions"], revalidate: false }
  );

  return cached();
}

export async function getBlogCategoryArchive(slug: string) {
  if (!slug) return null;

  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          ${CATEGORY_WITH_CHILDREN_FIELDS}
          query GetBlogCategoryWithChildren($id: ID!) {
            category(id: $id, idType: SLUG) {
              ...CategoryWithChildrenFields
            }
          }
        `,
        { id: slug },
        [`blog-category-${slug}`]
      );

      if (data === null) {
        throw new Error(`دریافت اطلاعات دسته‌بندی بلاگ «${slug}» با خطا مواجه شد`);
      }

      return data?.category ?? null;
    },
    ["blog-category-archive", slug],
    { tags: [`blog-category-${slug}`], revalidate: false }
  );

  return cached();
}

export async function getBlogTagArchive(slug: string) {
  if (!slug) return null;

  const cached = unstable_cache(
    async () => {
      const data = await fetchGraphQL(
        `
          query GetBlogTag($id: ID!) {
            tag(id: $id, idType: SLUG) {
              databaseId
              name
              slug
            }
          }
        `,
        { id: slug },
        [`blog-tag-${slug}`]
      );

      if (data === null) {
        throw new Error(`دریافت اطلاعات تگ «${slug}» با خطا مواجه شد`);
      }

      return data?.tag ?? null;
    },
    ["blog-tag-archive", slug],
    { tags: [`blog-tag-${slug}`], revalidate: false }
  );

  return cached();
}

export async function getAllBlogPosts(options: {
  search?: string;
  after?: string;
  categoryIds?: number[];
  categorySlugsForTags?: string[];
  tagSlugs?: string[];
} = {}) {
  const { search, after, categoryIds, categorySlugsForTags, tagSlugs } = options;
  const isSearch = Boolean(search);

  const tags = isSearch
    ? []
    : [
        ...(categorySlugsForTags && categorySlugsForTags.length
          ? categorySlugsForTags.map((slug) => `blog-category-${slug}`)
          : []),
        ...(tagSlugs && tagSlugs.length ? tagSlugs.map((slug) => `blog-tag-${slug}`) : []),
        ...(!categorySlugsForTags?.length && !tagSlugs?.length ? ["all-blog-posts"] : []),
      ];

  const data = await fetchGraphQL(
    `
      query GetAllBlogPosts($after: String, $search: String, $categoryIn: [ID], $tagSlugIn: [String]) {
        posts(first: 12, after: $after, where: { search: $search, categoryIn: $categoryIn, tagSlugIn: $tagSlugIn }) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id title slug date excerpt
            featuredImage { node { sourceUrl } }
            author { node { name } }
            categories(first: 1) { nodes { slug name } }
            commentsCount
          }
        }
      }
    `,
    { after, search, categoryIn: categoryIds, tagSlugIn: tagSlugs },
    tags,
    isSearch ? "no-store" : "force-cache"
  );

  return {
    posts: data?.posts?.nodes ?? [],
    pageInfo: data?.posts?.pageInfo ?? { hasNextPage: false, endCursor: null },
  };
}
