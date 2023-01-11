
// @ts-check
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { Shopify, LATEST_API_VERSION } from "@shopify/shopify-api";
import Koa from 'koa';
import applyAuthMiddleware from "./middleware/auth.js";
import verifyRequest from "./middleware/verify-request.js";
import { setupGDPRWebHooks } from "./gdpr.js";
import productCreator from "./helpers/product-creator.js";
import redirectToAuth from "./helpers/redirect-to-auth.js";
import { BillingInterval } from "./helpers/ensure-billing.js";
import { AppInstallations } from "./app_installations.js";
import ApifyClient from 'apify-client';
const { Translate } = require("@google-cloud/translate").v2;
import Router from "koa-router";

const USE_ONLINE_TOKENS = false;


const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

// TODO: There should be provided by env vars
const DEV_INDEX_PATH = `${process.cwd()}/frontend/`;
const PROD_INDEX_PATH = `${process.cwd()}/frontend/dist/`;

const DB_PATH = `${process.cwd()}/database.sqlite`;
var dataset;
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https?:\/\//, ""),
  HOST_SCHEME: process.env.HOST.split("://")[0],
  API_VERSION: LATEST_API_VERSION,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  // See note below regarding using CustomSessionStorage with this template.
  SESSION_STORAGE: new Shopify.Session.SQLiteSessionStorage(DB_PATH),
  ...(process.env.SHOP_CUSTOM_DOMAIN && { CUSTOM_SHOP_DOMAINS: [process.env.SHOP_CUSTOM_DOMAIN] }),
});

const ACTIVE_SHOPIFY_SHOPS = {};
// NOTE: If you choose to implement your own storage strategy using
// Shopify.Session.CustomSessionStorage, you MUST implement the optional
// findSessionsByShopCallback and deleteSessionsCallback methods.  These are
// required for the app_installations.js component in this template to
// work properly.

Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
  path: "/api/webhooks",
  webhookHandler: async (_topic, shop, _body) => {
    await AppInstallations.delete(shop);
  },
});

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const BILLING_SETTINGS = {
  required: false,
  // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
  // chargeName: "My Shopify One-Time Charge",
  // amount: 5.0,
  // currencyCode: "USD",
  // interval: BillingInterval.OneTime,
};

// This sets up the mandatory GDPR webhooks. You’ll need to fill in the endpoint
// in the “GDPR mandatory webhooks” section in the “App setup” tab, and customize
// the code when you store customer data.
//
// More details can be found on shopify.dev:
// https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks
setupGDPRWebHooks("/api/webhooks");

// export for test use only

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production",
  billingSettings = BILLING_SETTINGS
) {
  const app = express();

  app.set("use-online-tokens", USE_ONLINE_TOKENS);
  app.use(cookieParser(Shopify.Context.API_SECRET_KEY));
  app.use(express.json());

  applyAuthMiddleware(app, {
    billing: billingSettings,
  });

  // Do not call app.use(express.json()) before processing webhooks with
  // Shopify.Webhooks.Registry.process().
  // See https://github.com/Shopify/shopify-api-node/blob/main/docs/usage/webhooks.md#note-regarding-use-of-body-parsers
  // for more details.
  app.post("/api/webhooks", async (req, res) => {
    try {
      await Shopify.Webhooks.Registry.process(req, res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (e) {
      console.log(`Failed to process webhook: ${e.message}`);
      if (!res.headersSent) {
        res.status(500).send(e.message);
      }
    }
  });

  // All endpoints after this point will require an active session
  app.use(
    "/api/*",
    verifyRequest(app, {
      billing: billingSettings,
    })
  );

  app.get("/api/products/count", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );
    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );

    const countData = await Product.count({ session });
    res.status(200).send(countData);
  });

  app.post("/api/products/addone", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );

    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );
    let status = 200;
    let error = null;
    var newproduct = req.body;

    let tmp = [];
    newproduct[0].medias.map((media) => {
      let tmpO = {
        src: media.url
      }
      tmp.push(tmpO)
    })
    newproduct[0].medias = tmp;

    let variant_tmp = [];
    newproduct[0].variants.map((variant) => {
      let variant_tmp0 = {
        price: variant.price.current / 100,
        options: variant.options,
        title: variant.title
      }
      variant_tmp.push(variant_tmp0)
    })

    newproduct[0].variants = variant_tmp;

    let options_tmp = [];
    newproduct[0].options.map((option) => {

      console.log(option.type);
      options_tmp.push(option.type.toString())
    })

    newproduct[0].options = options_tmp;
    let product = newproduct;
    try {
      await productCreator(session, product);
    } catch (e) {
      console.log(`Failed to process products/create: ${e.message}`);
      status = 500;
      error = e.message;
    }
    res.status(status).send({ success: status === 200, error });
  });

  // Import select product
  app.post("/api/products/add", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );

    const projectId = 'ancient-link-369807';

    const translate = new Translate(
      {
        projectId: projectId, //eg my-project-0o0o0o0o'
        keyFilename: './ancient-link-369807-50a2a8f5becf.json' //eg my-project-0fwewexyz.json
      }
    );

    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );
    var query = req.query.value;
    var from = req.query.value.split("?")[1];
    var langto = req.query.value.split("?")[2];
    console.log("to", langto)
    var addproduct = [];
    var product_title = req.query.value.split("?")[0].split(",");
    dataset.map((element, index) => {
      product_title.map((ele, index) => {
        if (element.title == ele) {
          addproduct.push(element);
        }
      })
    });

    let status = 200;
    let error = null;

    setTimeout(async () => {
      addproduct.map((product) => {
        let tmp = [];
        product.medias.map((media) => {
          let tmpO = {
            src: media.url
          }
          tmp.push(tmpO)
        })
        product.medias = tmp;
      })

      addproduct.map(async (product) => {
        let title = await translate.translate(product.title, langto);
        console.log("title1", title[0]);
        product.title = title[0];
      })

      addproduct.map(async (product) => {
        let description = await translate.translate(product.description, langto);
        product.description = description[0];
       
      })

      addproduct.map((product) => {
        let variant_tmp = [];
        product.variants.map(async (variant) => {
          let variant_title = await translate.translate(variant.title, langto);
          variant.title = variant_title[0];
          let variant_option = await translate.translate(variant.options, langto);
          variant.options = variant_option[0];
          let variant_tmp0 = {
            price: variant.price.current / 100,
            options: variant.options,
            title: variant.title
          }
          variant_tmp.push(variant_tmp0)

        })

        product.variants = variant_tmp;
      })

      addproduct.map((product) => {
        let options_tmp = [];
        product.options.map(async (option) => {
          let options = await translate.translate(option.type, langto);
          option.type = options[0];
          options_tmp.push(options[0])
        })
        product.options = options_tmp;
      })

      setTimeout(async () => {
        console.log(addproduct[0].variants)
        try {
          await productCreator(session, addproduct);
        } catch (e) {
          console.log(`Failed to process products/create: ${e.message}`);
          status = 500;
          error = e.message;
        }
        res.status(status).send({ success: status === 200, error });
      }, 5000)
    }, 1000)
  });

  // Import all products
  app.post("/api/products/addall", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );
    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );
    const langto = req.query.value;
    let status = 200;
    let error = null;
    var addproduct = [];


    const projectId = 'ancient-link-369807';

    const translate = new Translate(
      {
        projectId: projectId, //eg my-project-0o0o0o0o'
        keyFilename: './ancient-link-369807-50a2a8f5becf.json' //eg my-project-0fwewexyz.json
      }
    );

    dataset.map((element, index) => {
      addproduct.push(element);
    });
    setTimeout(async () => {
      addproduct.map((product) => {
        let tmp = [];
        product.medias.map((media) => {
          let tmpO = {
            src: media.url
          }
          tmp.push(tmpO)
        })

        product.medias = tmp;
      })

       addproduct.map(async (product) => {
        let description = await translate.translate(product.description, langto);
        product.description = description[0];
       
      })

      addproduct.map(async (product) => {
        let title = await translate.translate(product.title, langto);
        console.log("title1", title[0]);
        product.title = title[0];
      })

      addproduct.map((product) => {
        let variant_tmp = [];
        product.variants.map(async (variant) => {
          let variant_title = await translate.translate(variant.title, langto);
          variant.title = variant_title[0];
          let variant_option = await translate.translate(variant.options, langto);
          variant.options = variant_option[0];
          let variant_tmp0 = {
            price: variant.price.current / 100,
            options: variant.options,
            title: variant.title
          }
          variant_tmp.push(variant_tmp0)

        })

        product.variants = variant_tmp;
      })

      addproduct.map((product) => {
        let options_tmp = [];
        product.options.map(async (option) => {
          let options = await translate.translate(option.type, langto);
          option.type = options[0];
          options_tmp.push(options[0])
        })

        product.options = options_tmp;

      })

      setTimeout(async () => {
        console.log(addproduct[0].variants)
        try {
          await productCreator(session, addproduct);
        } catch (e) {
          console.log(`Failed to process products/create: ${e.message}`);
          status = 500;
          error = e.message;
        }
        res.status(status).send({ success: status === 200, error });
      }, 5000)
    }, 1000)
  });



  app.post("/api/products/create", (req, res) => {
    console.log(req.query.value);
    const client = new ApifyClient({
      token: 'apify_api_oh2FdvadrA6TTf3xCsfvRrhMtCnsYO4ESQ6N',
    });

    // Prepare actor input
    const input = {
      "proxy": {
        "useApifyProxy": true
      },
      "startUrls": [
        {
          "url": req.query.value,
          "method": "GET"
        }
      ]
    };

    (async () => {
      // Run the actor and wait for it to finish
      const run = await client.actor("autofacts/shopify").call(input);

      // Fetch and print actor results from the run's dataset (if any)
      console.log('Results from dataset');
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      console.log("items", items);
      console.log('Results from dataset1');
      dataset = items;
      res.status(200).send({ items });
    })();

  });

  // All endpoints after this point will have access to a request.body
  // attribute, as a result of the express.json() middleware
  app.use(express.json());

  app.use((req, res, next) => {
    const shop = Shopify.Utils.sanitizeShop(req.query.shop);
    if (Shopify.Context.IS_EMBEDDED_APP && shop) {
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors https://${encodeURIComponent(
          shop
        )} https://admin.shopify.com;`
      );
    } else {
      res.setHeader("Content-Security-Policy", `frame-ancestors 'none';`);
    }
    next();
  });

  if (isProd) {
    const compression = await import("compression").then(
      ({ default: fn }) => fn
    );
    const serveStatic = await import("serve-static").then(
      ({ default: fn }) => fn
    );
    app.use(compression());
    app.use(serveStatic(PROD_INDEX_PATH, { index: false }));
  }

  app.use("/*", async (req, res, next) => {
    if (typeof req.query.shop !== "string") {
      res.status(500);
      return res.send("No shop provided");
    }



    const shop = Shopify.Utils.sanitizeShop(req.query.shop);
    const appInstalled = await AppInstallations.includes(shop);

    if (!appInstalled && !req.originalUrl.match(/^\/exitiframe/i)) {
      return redirectToAuth(req, res, app);
    }

    if (Shopify.Context.IS_EMBEDDED_APP && req.query.embedded !== "1") {
      const embeddedUrl = Shopify.Utils.getEmbeddedAppUrl(req);

      return res.redirect(embeddedUrl + req.path);
    }

    const htmlFile = join(
      isProd ? PROD_INDEX_PATH : DEV_INDEX_PATH,
      "index.html"
    );

    return res
      .status(200)
      .set("Content-Type", "text/html")
      .send(readFileSync(htmlFile));
  });

  return { app };
}

createServer().then(({ app }) => app.listen(PORT));
