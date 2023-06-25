const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Router = express.Router();
const CITY_CODE = require("../Utils/City");
const axios = require("axios");
const ProtocolLayer = require("../FunctionalityHandlers/MiddleWares");

function getCity(city, state, cityCode) {
  if (cityCode) {
    return cityCode;
  } else {
    cityCode = "Bengaluru";
    let cityMapping = CITY_CODE.find((x) => {
      if (x.City === city && x.State === state) {
        return x;
      }
    });

    if (cityMapping) {
      if (cityMapping.Code) {
        cityCode = cityMapping.Code;
      }
    }
    return cityCode;
  }
}

function createContextObject(contextObject = {}) {
  const {
    transactionId, //FIXME: if ! found in args then create new
    messageId = uuidv4(),
    action = contextObject.SEARCH,
    bppId,
    city,
    state,
    cityCode,
    bpp_uri,
  } = contextObject || {};

  return {
    domain: process.env.DOMAIN,
    country: process.env.country,
    city: getCity(city, state, cityCode),
    action: "search",
    core_version: "1.1.0",
    bap_id: process.env.bapId,
    bap_uri: process.env.bapUrl,
    bpp_uri: process.env.bpp_uri,
    transaction_id: getTransactionId(transactionId),
    message_id: messageId,
    timestamp: new Date(),
    ...(bppId && { bpp_id: bppId }),
    ttl: "PT30S",
  };
}

function getTransactionId(transactionId) {
  if (transactionId) {
    return transactionId;
  } else {
    return uuidv4();
  }
}

Router.post("/ondc-api/search", async (req, res) => {
  const { context: requestContext = {}, message = {} } = req.body;
  const { criteria = {}, payment } = message;

  const protocolContext = createContextObject({
    transactionId: requestContext?.transaction_id,
    bppId: requestContext?.bpp_id,
    city: requestContext.city,
    state: requestContext.state,
  });

  const { standards = {}, settlement = {} } = { criteria, payment } || {};

  const searchRequest = {
    context: protocolContext,
    message: {
      intent: {
        ...(standards?.search_string && {
          item: {
            descriptor: {
              name: standards.search_string,
            },
          },
        }),
        ...((standards?.provider_id ||
          standards?.category_id ||
          standards?.provider_name) && {
          provider: {
            ...(standards?.provider_id && {
              id: standards?.provider_id,
            }),
            ...(standards?.category_id && {
              category_id: standards.category_id,
            }),
            ...(standards?.provider_name && {
              descriptor: {
                name: standards?.provider_name,
              },
            }),
          },
        }),
        ...(standards?.pickup_location || standards?.delivery_location
          ? {
              fulfillment: {
                type: "Delivery",
                ...(standards?.pickup_location && {
                  start: {
                    location: {
                      gps: standards?.pickup_location,
                    },
                  },
                }),
                ...(standards?.delivery_location && {
                  end: {
                    location: {
                      gps: standards?.delivery_location,
                    },
                  },
                }),
              },
            }
          : {
              fulfillment: {
                type: "Delivery",
              },
            }),
        ...((standards?.category_id || standards?.category_name) && {
          category: {
            ...(standards?.category_id && {
              id: standards?.category_id,
            }),
            ...(standards?.category_name && {
              descriptor: {
                name: standards?.category_name,
              },
            }),
          },
        }),
        payment: {
          "@ondc/org/buyer_app_finder_fee_type":
            settlement?.buyer_app_finder_fee_type ||
            process.env.BAP_FINDER_FEE_TYPE,
          "@ondc/org/buyer_app_finder_fee_amount":
            settlement?.buyer_app_finder_fee_amount ||
            process.env.BAP_FINDER_FEE_AMOUNT,
        },
      },
    },
  };

  try {
    // Protocol Layer Call
    // const response = await axios.post('http://localhost:9900/protocol/search', searchRequest);

    // console.log(response)

    const Layer = new ProtocolLayer();
    const protocolResponse = Layer.gatewaySearch(searchRequest);

    console.log(protocolResponse);

    res.send({
      context: protocolContext,
      searchRequest: searchRequest,
      message: protocolResponse.message,
    }); // Access response data
  } catch (err) {
    console.log(err);
  }
});

Router.post("/ondc-api/on_search", async (req, res) => {
  const { query } = req;
  const { messageId } = query;

  if (messageId) {
    searchService
      .onSearch(query)
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        console.log("here I am");
        next(err);
      });
  } else throw new BadRequestParameterError();
});

module.exports = Router;
