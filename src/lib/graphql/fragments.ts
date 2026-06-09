// فرگمنت‌های گراف‌کیوال برای جلوگیری از تکرار کوئری‌ها

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