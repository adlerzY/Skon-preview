import "server-only";

export const ADMIN_BOOTSTRAP_QUERY = `
  query GetAdminBootstrap {
    viewer {
      id
      databaseId
      name
      email
      avatarUrl
      isStaff
      hasManualPassword
      adminPermissions
    }
  }
`;

export const ADMIN_DASHBOARD_QUERY = `
  query GetAdminDashboard($first: Int) {
    adminOpenTicketsCount
    pendingReviewsCount
    adminProcessingOrdersCount
    adminPricingHealth { status apiConfigured apiHealthy apiStatus fallbackActive availableRates checkedAt }
    adminOpenTickets(first: $first) {
      id
      databaseId
      title
      date
      linkedOrderId
      customerName
    }
  }
`;

export const ADMIN_DASHBOARD_SUMMARY_QUERY = `
  query GetAdminDashboardSummary {
    adminOpenTicketsCount
    pendingReviewsCount
    adminProcessingOrdersCount
    adminPricingHealth { status apiConfigured apiHealthy apiStatus fallbackActive availableRates checkedAt }
  }
`;

export const ADMIN_ORDERS_QUERY = `
  query GetAdminOrders($first: Int, $after: String, $status: String, $search: String) {
    adminOrders(first: $first, after: $after, status: $status, search: $search) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId orderNumber status paymentStatus fulfillmentStatus total currency date
        customerId customerName customerEmail
        items { databaseId productId variationId productName quantity deliveryMethod deliveredQuantity fulfillmentStatus }
      }
    }
  }
`;

export const ADMIN_ORDER_QUERY = `
  query GetAdminOrder($id: Int!) {
    adminOrder(id: $id) {
      databaseId orderNumber status paymentStatus fulfillmentStatus total currency date
      customerId customerName customerEmail linkedTicketIds
      items { databaseId productId variationId productName quantity deliveryMethod deliveredQuantity fulfillmentStatus }
      notes { id content date author }
    }
  }
`;

export const ADMIN_ADD_ORDER_NOTE_MUTATION = `
  mutation AdminAddOrderNote($orderId: Int!, $content: String!) {
    adminAddOrderNote(input: { orderId: $orderId, content: $content }) { success }
  }
`;

export const ADMIN_UPDATE_ORDER_STATUS_MUTATION = `
  mutation AdminUpdateOrderStatus($orderId: Int!, $status: String!) {
    adminUpdateOrderStatus(input: { orderId: $orderId, status: $status }) { success status }
  }
`;

export const ADMIN_UPDATE_ORDER_ITEM_FULFILLMENT_MUTATION = `
  mutation AdminUpdateOrderItemFulfillment($orderId: Int!, $itemId: Int!, $status: String!) {
    adminUpdateOrderItemFulfillment(input: { orderId: $orderId, itemId: $itemId, status: $status }) { success status }
  }
`;

export const ADMIN_TICKETS_QUERY = `
  query GetAdminTickets($first: Int, $after: String, $status: String, $search: String, $mineOnly: Boolean) {
    adminTickets(first: $first, after: $after, status: $status, search: $search, mineOnly: $mineOnly) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId title date status priority customerId customerName customerEmail linkedOrderId assigneeId assigneeName claimExpiresAt
      }
    }
  }
`;

export const ADMIN_TICKET_QUERY = `
  query GetAdminTicket($id: Int!) {
    adminTicket(id: $id) {
      ticket {
        databaseId title date status priority customerId customerName customerEmail linkedOrderId assigneeId assigneeName claimExpiresAt
      }
      replies { id authorName authorRole content createdAt }
      events { id type content fromStatus toStatus adminName createdAt }
      internalNotes { id type content fromStatus toStatus adminName createdAt }
    }
  }
`;

export const ADMIN_CLAIM_TICKET_MUTATION = `
  mutation AdminClaimTicket($ticketId: Int!) {
    adminClaimTicket(input: { ticketId: $ticketId }) { success expiresAt }
  }
`;

export const ADMIN_REPLY_TICKET_MUTATION = `
  mutation AdminReplyToTicket($ticketId: Int!, $content: String!) {
    adminReplyToTicket(input: { ticketId: $ticketId, content: $content }) { success status }
  }
`;

export const ADMIN_ADD_TICKET_NOTE_MUTATION = `
  mutation AdminAddTicketNote($ticketId: Int!, $content: String!) {
    adminAddTicketNote(input: { ticketId: $ticketId, content: $content }) { success }
  }
`;

export const ADMIN_SET_TICKET_STATUS_MUTATION = `
  mutation AdminSetTicketStatus($ticketId: Int!, $status: String!) {
    adminSetTicketStatus(input: { ticketId: $ticketId, status: $status }) { success status }
  }
`;

export const ADMIN_REASSIGN_TICKET_MUTATION = `
  mutation AdminReassignTicket($ticketId: Int!, $adminUserId: Int!) {
    adminReassignTicket(input: { ticketId: $ticketId, adminUserId: $adminUserId }) { success }
  }
`;


export const ADMIN_REVIEWS_QUERY = `
  query GetAdminReviews($first: Int, $after: String, $state: String) {
    adminReviews(first: $first, after: $after, state: $state) {
      pageInfo { hasNextPage endCursor }
      nodes { databaseId content rating date status moderationState userId userName userEmail productId productName productSlug }
    }
  }
`;

export const ADMIN_MODERATE_REVIEW_MUTATION = `
  mutation AdminModerateReview($reviewId: Int!, $action: String!) {
    adminModerateReview(input: { reviewId: $reviewId, action: $action }) { success state }
  }
`;

export const ADMIN_REPLY_REVIEW_MUTATION = `
  mutation AdminReplyToReview($reviewId: Int!, $content: String!) {
    adminReplyToReview(input: { reviewId: $reviewId, content: $content }) { success }
  }
`;

export const ADMIN_NOTIFICATIONS_QUERY = `
  query GetAdminNotifications($first: Int, $unreadOnly: Boolean) {
    adminNotifications(first: $first, unreadOnly: $unreadOnly) {
      databaseId type title body link isRead createdAt
    }
  }
`;

export const MARK_ADMIN_NOTIFICATIONS_READ_MUTATION = `
  mutation MarkAdminNotificationsRead($notificationIds: [Int]) {
    markAdminNotificationsRead(input: { notificationIds: $notificationIds }) { success }
  }
`;


export const ADMIN_STAFF_USERS_QUERY = `
  query GetAdminStaffUsers {
    adminStaffUsers { databaseId name email }
  }
`;

export const ADMIN_CDKEY_STOCK_QUERY = `
  query GetAdminCdKeyStock($first: Int, $after: String, $status: String, $productId: Int, $variationId: Int) {
    adminCdKeyStock(first: $first, after: $after, status: $status, productId: $productId, variationId: $variationId) {
      pageInfo { hasNextPage endCursor }
      summary { available reserved used failed total }
      nodes {
        stockId productId variationId productName variationName status
        orderId itemId addedBy createdAt usedAt failureReason assignmentAttempts
      }
    }
  }
`;

export const ADMIN_IMPORT_CDKEYS_MUTATION = `
  mutation AdminImportCdKeys($productId: Int!, $variationId: Int!, $keys: String!) {
    adminImportCdKeys(input: { productId: $productId, variationId: $variationId, keys: $keys }) {
      success requested added rejected availableCount
    }
  }
`;

export const ADMIN_DELETE_CDKEY_MUTATION = `
  mutation AdminDeleteCdKey($stockId: Int!) {
    adminDeleteCdKey(input: { stockId: $stockId }) { success }
  }
`;

export const ADMIN_ASSIGN_CDKEYS_MUTATION = `
  mutation AdminAssignCdKeys($orderId: Int!, $itemId: Int!, $quantity: Int!) {
    adminAssignCdKeys(input: { orderId: $orderId, itemId: $itemId, quantity: $quantity }) {
      success assigned deliveredQuantity remainingQuantity fulfillmentStatus
    }
  }
`;

export const ADMIN_ASSIGN_CDKEY_MANUALLY_MUTATION = `
  mutation AdminAssignCdKeyManually($orderId: Int!, $itemId: Int!, $key: String!) {
    adminAssignCdKeyManually(input: { orderId: $orderId, itemId: $itemId, key: $key }) {
      success deliveredQuantity remainingQuantity fulfillmentStatus
    }
  }
`;

export const ADMIN_REVEAL_CDKEYS_MUTATION = `
  mutation AdminRevealCdKeys($orderId: Int!, $itemId: Int!) {
    adminRevealCdKeys(input: { orderId: $orderId, itemId: $itemId }) { values }
  }
`;


export const SITE_MAINTENANCE_QUERY = `
  query GetSiteMaintenanceMode {
    siteMaintenanceMode
  }
`;

export const ADMIN_SET_MAINTENANCE_MUTATION = `
  mutation SetSiteMaintenanceMode($enabled: Boolean!) {
    setSiteMaintenanceMode(input: { enabled: $enabled }) { success enabled }
  }
`;
