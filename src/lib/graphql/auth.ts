import "server-only";

export const LOGIN_MUTATION = `
  mutation LoginUser($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
      user {
        id
        databaseId
        name
        email
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshAuthToken($refreshToken: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $refreshToken }) {
      authToken
    }
  }
`;

export const WRITE_REVIEW_MUTATION = `
  mutation WriteProductReview($productId: Int!, $rating: Int!, $content: String!) {
    writeReview(input: { commentOn: $productId, rating: $rating, content: $content }) {
      review {
        id
        databaseId
        approved
        content
      }
      rating
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = `
  query GetCustomerOrders {
    customer {
      databaseId
      orders(first: 30) {
        nodes {
          id
          databaseId
          orderNumber
          status
          date
          total
          lineItems {
            nodes {
              productId
              quantity
              total
              product {
                node {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_ORDER_MUTATION = `
  mutation CreateStoreOrder(
    $lineItems: [LineItemInput]
    $billing: CustomerAddressInput
    $customerNote: String
  ) {
    createOrder(
      input: {
        lineItems: $lineItems
        billing: $billing
        customerNote: $customerNote
        isPaid: false
      }
    ) {
      order {
        id
        databaseId
        orderKey
        orderNumber
        total
        status
      }
    }
  }
`;