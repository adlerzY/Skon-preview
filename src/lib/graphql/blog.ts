import "server-only";

export const FOLLOW_CATEGORY_MUTATION = `
  mutation FollowBlogCategory($categoryId: Int!) {
    followBlogCategory(input: { categoryId: $categoryId }) {
      success
      isFollowing
    }
  }
`;

export const UNFOLLOW_CATEGORY_MUTATION = `
  mutation UnfollowBlogCategory($categoryId: Int!) {
    unfollowBlogCategory(input: { categoryId: $categoryId }) {
      success
      isFollowing
    }
  }
`;

export const RATE_POST_MUTATION = `
  mutation RateBlogPost($postId: Int!, $rating: Int!) {
    rateBlogPost(input: { postId: $postId, rating: $rating }) {
      success
      averageRating
      ratingCount
      myRating
    }
  }
`;

export const WRITE_BLOG_COMMENT_MUTATION = `
  mutation WriteBlogComment($postId: Int!, $content: String!) {
    writeBlogComment(input: { postId: $postId, content: $content }) {
      success
      approved
    }
  }
`;

export const REPLY_BLOG_COMMENT_MUTATION = `
  mutation ReplyToBlogComment($commentId: Int!, $content: String!) {
    replyToBlogComment(input: { commentId: $commentId, content: $content }) {
      success
      approved
    }
  }
`;

export const POST_COMMENTS_QUERY = `
  query GetPostComments($id: ID!, $after: String) {
    post(id: $id, idType: DATABASE_ID) {
      comments(first: 20, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          databaseId
          parentDatabaseId
          isStaffReply
          content
          date
          author {
            node {
              name
              ... on User { avatarUrl }
            }
          }
        }
      }
    }
  }
`;