import { Shopify } from "@shopify/shopify-api";

export const DEFAULT_PRODUCTS_COUNT = 5;
const CREATE_PRODUCTS_MUTATION = `
  mutation call($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
      }
      userErrors {
        message
        field
      }
    }
  }
`

export default async function productCreator(session, addproduct) {
  const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
  // Initialize the ApifyClient with API token
  try {
    for (let i = 0; i < addproduct.length; i++) {
      await client.query({
        data: {
          query: CREATE_PRODUCTS_MUTATION,
          variables: {
            input: {
              title: addproduct[i].title,
              bodyHtml: addproduct[i].description,
              options: addproduct[i].options,
              images: addproduct[i].medias,
              variants: addproduct[i].variants,
              tags : addproduct[i].tags
            },
          },
        },
      });
    }
  } catch (error) {
    if (error instanceof ShopifyErrors.GraphqlQueryError) {
      throw new Error(`${error.message}\n${JSON.stringify(error.response, null, 2)}`);
    } else {
      throw error;
    }
  }
}

function randomTitle() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}

function randomPrice() {
  return Math.round((Math.random() * 10 + Number.EPSILON) * 100) / 100;
}
