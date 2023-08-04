const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Router = express.Router();
const CITY_CODE = require("../Utils/City");
const axios = require("axios");
const { authentication } = require("../AuthMiddlewares/middlewares/index");
const ProtocolLayer = require("../FunctionalityHandlers/MiddleWares");
const Cookies = require("js-cookie");
const useCancellablePromise = require("./CancelReq/CancellableProm");

function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  const currentTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
  return currentTime;
}

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
    action = "search",
    bppId,
    city,
    state,
    cityCode,
  } = contextObject || {};

  return {
    domain: "nic2004:52110",
    country: "IND",
    city: "*",
    action: "search",
    core_version: "1.1.0",
    bap_id: "ondc-jatah.web.app",
    bap_uri: "https://ondc-jatah.web.app",
    transaction_id: getTransactionId(transactionId),
    message_id: messageId,
    timestamp: getCurrentTime(),
    ...(bppId && { bpp_id: bppId }),
    ttl: "P1M",
  };
}

function getTransactionId(transactionId) {
  if (transactionId) {
    return transactionId;
  } else {
    return uuidv4();
  }
}

// {
//   context: { city: 'Bengaluru', state: 'Karnataka' },
//   message: {
//     criteria: {
//       search_string: 'milk',
//       delivery_location: '12.9236470000001,77.5861180000001'
//     }
//   }
// }

async function makeApiCall(data) {
  const apiUrl = 'http://localhost:9900/protocol/search'; 

  try {
    const response = await axios.post(apiUrl, data);
    console.log(response.data, 'data here!');
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Re-throw the error to handle it in the calling code.
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
  const searchRequest = {
    context: protocolContext,
    message: {
      intent: {
        ...(criteria?.search_string && {
          provider: {
            descriptor: {
              name: criteria.search_string,
            },
          },
        }),
        ...((criteria?.provider_id ||
          criteria?.category_id ||
          criteria?.provider_name) && {
          provider: {
            ...(criteria?.provider_id && {
              id: criteria?.provider_id,
            }),
            ...(criteria?.category_id && {
              category_id: criteria.category_id,
            }),
            ...(criteria?.provider_name && {
              descriptor: {
                name: criteria?.provider_name,
              },
            }),
          },
        }),
        ...(criteria?.pickup_location || criteria?.delivery_location
          ? {
              fulfillment: {
                type: "Delivery",
                ...(criteria?.pickup_location && {
                  start: {
                    location: {
                      gps: criteria?.pickup_location,
                    },
                  },
                }),
                ...(criteria?.delivery_location && {
                  end: {
                    location: {
                      gps: criteria?.delivery_location,
                      address: { area_code: "560041" },
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
        ...((criteria?.category_id || criteria?.category_name) && {
          category: {
            ...(criteria?.category_id && {
              id: criteria?.category_id,
            }),
            ...(criteria?.category_name && {
              descriptor: {
                name: criteria?.category_name,
              },
            }),
          },
        }),
        payment: {
          "@ondc/org/buyer_app_finder_fee_type": "percent",
          "@ondc/org/buyer_app_finder_fee_amount": "2",
        },
      },
    },
  };
  await makeApiCall(searchRequest)
  .then((result) => {
    res.send(result);
  })
  .catch((error) => {
    res.send(error);
  });

  // try {
  //   const Layer = new ProtocolLayer();
  //   const protocolResponse = await Layer.gatewaySearch(searchRequest); 
    
  //   res.send(protocolResponse); 
  // } catch (err) {
  //   console.log(err);
  // }
});

module.exports = Router;
