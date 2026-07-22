export const PRODUCT_CARD_FIELDS = `
  fragment ProductCardFields on Product {
    id
    databaseId
    name
    slug
    featured
    date
    shortDescription
    shortNotify

    image {
      sourceUrl(size: MEDIUM)
    }

    productCategories(first: 10) {
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
`;

export const BANNER_FIELDS = `
  fragment BannerFields on CategoryBannerItem {
    title
    secondimage
    subtitle
    imageUrl
    link
  }
`;

export const HERO_TAB_FIELDS = `
  fragment HeroTabFields on HeroTabItem {
    tabLabel
    heading
    description
    ctaText
    ctaLink
    imageUrl
  }
`;

export const CATEGORY_BASIC_FIELDS = `
  fragment CategoryBasicFields on ProductCategory {
    id
    databaseId
    name
    slug
    count

    image {
      sourceUrl
    }
  }
`;

export const CATEGORY_WITH_CHILDREN_FIELDS = `
  fragment CategoryWithChildrenFields on Category {
    id
    databaseId
    name
    slug
    count
    followerCount
    categoryImage { sourceUrl(size: "thumbnail") }
    parent {
      node {
        id
        databaseId
        name
        slug
        children(where: { hideEmpty: false }, first: 20) {
          nodes { id databaseId name slug count categoryImage { sourceUrl(size: "thumbnail") } }
        }
      }
    }
    children(where: { hideEmpty: false }, first: 20) {
      nodes { id databaseId name slug count categoryImage { sourceUrl(size: "thumbnail") } }
    }
  }
`;