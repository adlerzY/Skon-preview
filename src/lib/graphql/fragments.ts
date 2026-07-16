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