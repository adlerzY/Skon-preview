// FILE: src/lib/graphql/auth.ts
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
          id databaseId orderNumber status date total
          lineItems {
            nodes {
              id databaseId quantity total
              fulfillmentStatus
              product { name databaseId }
              metaData { key value }
            }
          }
        }
      }
      downloadableItems {
        nodes { downloadId url product { databaseId } }
      }
    }
  }
`;

export const DASHBOARD_SUMMARY_QUERY = `
  query GetDashboardSummary {
    customer {
      orders(first: 10) {
        nodes {
          id
          databaseId
          orderNumber
          status
          date
          total
        }
      }
    }
    viewer {
      wishlistIds
    }
    supportTickets(first: 10) {
      nodes {
        id
        databaseId
        title
        date
        ticketStatus
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
        paymentUrl
      }
    }
  }
`;

export const UPDATE_AVATAR_MUTATION = `
  mutation UpdateUserAvatar($avatarUrl: String!) {
    updateUserAvatar(input: { avatarUrl: $avatarUrl }) {
      success
      avatarUrl
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateCustomerProfile($firstName: String, $lastName: String, $email: String) {
    updateCustomerProfile(input: { firstName: $firstName, lastName: $lastName, email: $email }) {
      success
      name
      email
    }
  }
`;

export const CUSTOMER_ORDERS_LIGHT_QUERY = `
  query GetCustomerOrdersLight {
    customer {
      orders(first: 30) {
        nodes { databaseId orderNumber date }
      }
    }
  }
`;

export const CREATE_SUPPORT_TICKET_MUTATION = `
  mutation CreateSupportTicket($title: String!, $content: String!, $linkedOrderId: Int) {
    createSupportTicket(input: { title: $title, content: $content, linkedOrderId: $linkedOrderId }) {
      ticketId
    }
  }
`;

export const TOGGLE_WISHLIST_MUTATION = `
  mutation ToggleWishlistItem($productId: Int!) {
    toggleWishlistItem(input: { productId: $productId }) {
      inWishlist
    }
  }
`;