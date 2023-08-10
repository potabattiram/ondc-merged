const naclUtil = require("tweetnacl-util");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const BppInitService = require("./Services/bppInitservice.js");
const mongoose = require('mongoose');

const base64 = require("base64-js");
const nacl = require("tweetnacl");

class Middleware {
  constructor() {}
  Utf8Encoder = new TextEncoder();
  bppInitService = new BppInitService();

  hashMessage(msg) {
    const digest = nacl.hash(naclUtil.decodeUTF8(msg));
    const digestStr = naclUtil.encodeBase64(digest);
    return digestStr;
  }

  getTransactionId(transactionId) {
    if (transactionId) {
      return transactionId;
    } else {
      return uuidv4();
    }
  }

  getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

    const currentTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
    return currentTime;
  }
  ContextFactory(contextObject = {}) {
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
      transaction_id: this.getTransactionId(transactionId),
      message_id: messageId,
      timestamp: this.getCurrentTime(),
      ...(bppId && { bpp_id: bppId }),
      ttl: "P1M",
    };
  }

  async lookupCall(url, payload, headers = {}) {
    try {
      const response = await axios.post(url, payload, { headers: headers });
      return [response.data, response.status];
    } catch (error) {
      return [null, error.response.status];
    }
  }

  signResponse(signing_key, private_key) {
    const private_key64 = base64.toByteArray(private_key);
    const seed = this.cryptoSignEd25519SkToSeed(private_key64);
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const signed = nacl.sign.detached(
      this.Utf8Encoder.encode(signing_key),
      keyPair.secretKey
    );
    const signature = base64.fromByteArray(signed);
    return signature;
  }

  cryptoSignEd25519SkToSeed(private_key) {
    return private_key.subarray(0, 32);
  }

  createSigningString(digestBase64, created = null, expires = null) {
    const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digestBase64}`;
    return signingString;
  }

  createAuthorizationHeader(requestBody, created = null, expires = null) {
    created = created || Math.floor(Date.now() / 1000);
    expires = expires || Math.floor((Date.now() + 3600000) / 1000); // 1 hour expiration

    const signingKey = this.createSigningString(
      this.hashMessage(JSON.stringify(requestBody)),
      created,
      expires
    );

    const privateKey =
      "Ew/pm7Hmeb6q0vNghsw+tGgbH0/UdHoOjvwOQVViIc9+l0Jqtlca4ZNo062yg3NC/BJcSmh8cYN82fv4t9muvA==";
    const signature = this.signResponse(signingKey, privateKey);

    const subscriberId = "ondc-jatah.web.app";
    const uniqueKeyId = "710";
    const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

    return header;
  }

  async gatewaySearch(searchRequest) {
    const requestType = "search";
    const gatewayUrl = await this.fetchSubscriberUrlFromLookup(requestType);
    const searchUrl = gatewayUrl.endsWith("/")
      ? `${gatewayUrl}${requestType}`
      : `${gatewayUrl}/${requestType}`;
    const authHeader = this.createAuthorizationHeader(searchRequest);
    console.log(
      `making request to bg or bpp with ${JSON.stringify(searchRequest)}`
    );

    let HeaderObj = { Authorization: authHeader };
    return this.post_on_bg_or_bpp(searchUrl, searchRequest, HeaderObj);
  }

  async fetchSubscriberUrlFromLookup(requestType, subscriberId = null) {
    const subscriberType = requestType === "search" ? "BG" : "BPP";
    const payload = {
      type: subscriberType,
      country: "IND",
      domain: "nic2004:52110",
    };

    if (subscriberId) {
      payload.subscriber_id = subscriberId;
    }

    const updatedPayload =
      process.env.ENV === "pre_prod"
        ? this.formatRegistryRequestForPreProd(payload)
        : payload;

    const [response, statusCode] = await this.lookupCall(
      "https://pilot-gateway-1.beckn.nsdl.co.in/lookup",
      updatedPayload
    );

    if (statusCode === 200) {
      if (response[0].network_participant) {
        const subscriberId = response[0].subscriber_id;
        const subscriberUrl = response[0].network_participant[0].subscriber_url;
        return `https://${subscriberId}${subscriberUrl}`;
      } else {
        return response[0].subscriber_url;
      }
    } else {
      return null;
    }
  }

  formatRegistryRequestForPreProd(request, vlookup = false) {
    request.type = subscriberTypeMapping[request.type];
    if (vlookup) {
      const signature = this.signRegistryRequest(request);
      return {
        sender_subscriber_id: "buyer-app.ondc.org",
        request_id: uuidv4(),
        timestamp: new Date().toISOString(),
        search_parameters: request,
        signature: signature,
      };
    } else {
      return request;
    }
  }

  signRegistryRequest(request) {
    const reqObj = [];
    if (request.country) {
      reqObj.push(request.country);
    }
    if (request.domain) {
      reqObj.push(request.domain);
    }
    if (request.type) {
      reqObj.push(request.type);
    }
    if (request.city) {
      reqObj.push(request.city);
    }
    if (request.subscriber_id) {
      reqObj.push(request.subscriber_id);
    }
    const signingString = reqObj.join("|");
    return signResponse(
      signingString,
      "lP3sHA+9gileOkXYJXh4Jg8tK0gEEMbf9yCPnFpbldhrAY+NErqL9WD+Vav7TE5tyVXGXBle9ONZi2W7o144eQ=="
    );
  }

  async post_on_bg_or_bpp(url, payload, Headers) {
    try {
      console.log(
        `Making POST call for ${payload.context.message_id} on ${url}`
      );

      Headers["Content-Type"] = "application/json";

      const raw_data = {"context":{"domain":"nic2004:52110","country":"IND","city":"*","action":"search","core_version":"1.1.0","bap_id":"ondc-jatah.web.app","bap_uri":"https://ondc-jatah.web.app","transaction_id":"4b53914d-db0f-4428-acbc-ad1920c51418","message_id":"034f5f01-3d43-4812-bdd2-0e6a69dc8d79","timestamp":"2023-08-09T12:00:41.827Z","ttl":"P1M"},"message":{"intent":{"provider":{"id":"milk"},"fulfillment":{"type":"Delivery","end":{"location":{"gps":"12.9236470000001,77.5861180000001","address":{"area_code":"560041"}}}},"payment":{"@ondc/org/buyer_app_finder_fee_type":"percent","@ondc/org/buyer_app_finder_fee_amount":"2"}}}}
      const header = {'Authorization': 'Signature keyId="ondc-jatah.web.app|710|ed25519",algorithm="ed25519",created="1691562641",expires="1691566241",headers="(created) (expires) digest",signature="GgkmpN/xIsDyFWedE6L01E6RzBUBtPtJxawuR2YTntgjmYhnViNqWXeqKnarxeXJRZTIScm5489gLH+B9uirAQ=="', 'Content-Type': 'application/json'}
      const response = await axios.post(url, raw_data, {
        headers: header,
      });

      return [response.data, response.status];
    } catch (error) {
      console.error(error);
      return [null, error.response.status];
    }
  }

  // ORDER INITIALIZATION
  async initMultipleOrder(orders, user) {
    const initOrderResponse = await Promise.all(
      orders.map(async (order) => {
        try {
          const bppResponse = await this.initOrder(order, orders.length > 1);
          await this.createOrder(
            bppResponse,
            user?.decodedToken?.uid,
            order?.message
          );

          return bppResponse;
        } catch (err) {
          return err.response.data;
        }
      })
    );

    return initOrderResponse;
  }

  areMultipleBppItemsSelected(items) {
    return items
      ? [...new Set(items.map((item) => item.bpp_id))].length > 1
      : false;
  }

  areMultipleProviderItemsSelected(items) {
    return items
      ? [...new Set(items.map((item) => item.provider.id))].length > 1
      : false;
  }

  async initOrder(orderRequest, isMultiSellerRequest = false) {
    try {
      const { context: requestContext = {}, message: order = {} } =
        orderRequest || {};
      const parentOrderId = requestContext?.transaction_id; //FIXME: verify usage

      const context = this.contextFactory({
        action: "init",
        bppId: order?.items[0]?.bpp_id,
        bpp_uri: order?.items[0]?.bpp_uri,
        city: requestContext.city,
        state: requestContext.state,
        transactionId: requestContext?.transaction_id,
        // ...(!isMultiSellerRequest && { transactionId: requestContext?.transaction_id })
      });

      if (!order?.items?.length) {
        return {
          context,
          error: { message: "Empty order received" },
        };
      } else if (this.areMultipleBppItemsSelected(order?.items)) {
        return {
          context,
          error: {
            message: "More than one BPP's item(s) selected/initialized",
          },
        };
      } else if (this.areMultipleProviderItemsSelected(order?.items)) {
        return {
          context,
          error: {
            message: "More than one Provider's item(s) selected/initialized",
          },
        };
      }

      const BPPService = new BppInitService();
      const bppResponse = await BPPService.init(
        context,
        order,
        parentOrderId
      );

      return bppResponse;
    } catch (err) {
      throw err;
    }
  }

  async createOrder(response, userId = null, orderRequest) {  
    if (response) {
      const provider = orderRequest?.items?.[0]?.provider || {};

      const providerDetails = {
        id: provider.id,
        locations: provider.locations.map((location) => {
          return { id: location };
        }),
      };

      console.log(
        "orderRequest---------name------->",
        orderRequest?.delivery_info?.name
      );
      console.log(
        "orderRequest-----------delivery_info----->",
        orderRequest?.delivery_info
      );
      const fulfillment = {
        end: {
          contact: {
            email: orderRequest?.delivery_info?.email,
            phone: orderRequest?.delivery_info?.phone,
          },
          location: {
            ...orderRequest?.delivery_info?.location,
            address: {
              ...orderRequest?.delivery_info?.location?.address,
              name: orderRequest?.delivery_info?.name,
            },
          },
        },
        type: orderRequest?.delivery_info?.type,
        customer: {
          person: {
            name: orderRequest?.delivery_info?.name,
          },
        },
        provider_id: provider?.id,
      };

      let itemProducts = [];
      for (const item of orderRequest?.items) {
        let itemObj = {
          id: item?.id?.toString(),
          product: item?.product,
          quantity: item.quantity,
          fulfillment_id: item?.fulfillment_id,
        };
        itemProducts.push(itemObj);
      }

      console.log("itemProducts--------------->", itemProducts);
      // console.log('itemProducts--------response?.context?.bpp_id------->',response?.context?.bpp_id);
      console.log(
        "itemProducts--------response?.context?.bpp_id------->",
        fulfillment
      );

   
      await this.addOrUpdateOrderWithTransactionIdAndProvider(
        response.context.transaction_id,
        provider.id,
        {
          userId: userId,
          messageId: response?.context?.message_id,
          transactionId: response?.context?.transaction_id,
          parentOrderId: response?.context?.parent_order_id,
          bppId: response?.context?.bpp_id,
          bpp_uri: response?.context?.bpp_uri,
          fulfillments: [fulfillment],
          provider: { ...providerDetails },
          items: itemProducts,
        }
      );
    }
  }

  async addOrUpdateOrderWithTransactionIdAndProvider(transactionId, providerId, orderSchema = {}){

    const OrderSchema = new mongoose.Schema(
      {
          provider: { type: ProviderSchema },
          items: { type: [ItemsSchema] },
          addOns: { type: [AddOnsSchema] },
          offers: { type: [OfferSchema] },
          billing: { type: BillingSchema },
          fulfillments: { type: [FulfillmentSchema] },
          quote: { type: Object },
          updatedQuote: { type: Object},
          payment: { type: PaymentSchema },
          id: { type: String },
          city: { type: String },
          state: { type: String }, //["PENDING-CONFIRMATION", "Ordered", "CANCELLED", "Pending", "Active", "Processing"]
          userId: String,
          transactionId: { type: String },
          messageId: { type: String },
          parentOrderId: { type: String },
          paymentStatus: { type: String, enum: ['PAID', 'NOT-PAID'], default: null },
          bppId: { type: String },
          bpp_uri: { type: String },
          bapOrderId: { type: String },
          settlementDetails:{type:Object}
          },
          { _id: true, timestamps: true }
      );
  
    OrderSchema.index({userId: 1, createdAt: -1});
    const Order = mongoose.model('order', OrderSchema, "order");
    return await Order.findOneAndUpdate(
      {
          transactionId: transactionId,
          "provider.id":providerId
      },
      {
          ...orderSchema
      },
      { upsert: true }
  );
  }
}

module.exports = Middleware;
