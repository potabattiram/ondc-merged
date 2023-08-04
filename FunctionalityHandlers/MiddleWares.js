const naclUtil = require("tweetnacl-util");
const axios = require("axios");

const base64 = require("base64-js");
const nacl = require("tweetnacl");

class Middleware {
  constructor() {}
  Utf8Encoder = new TextEncoder();

  hashMessage(msg) {
    const digest = nacl.hash(naclUtil.decodeUTF8(msg));
    const digestStr = naclUtil.encodeBase64(digest);
    return digestStr;
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
    console.log(header,'headddr')
    
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

      const raw_data = {"context":{"domain":"nic2004:52110","country":"IND","city":"*","action":"search","core_version":"1.1.0","bap_id":"ondc-jatah.web.app","bap_uri":"https://ondc-jatah.web.app","transaction_id":"c56c37ae-481f-4b01-9d67-e090616e1264","message_id":"495c5166-0d75-4113-8158-5fcc7a31f02b","timestamp":"2023-08-04T10:19:06.879Z","ttl":"P1M"},"message":{"intent":{"provider":{"descriptor":{"name":"milk"}},"fulfillment":{"type":"Delivery","end":{"location":{"gps":"12.9236470000001,77.5861180000001","address":{"area_code":"560041"}}}},"payment":{"@ondc/org/buyer_app_finder_fee_type":"percent","@ondc/org/buyer_app_finder_fee_amount":"2"}}}}
      const header = {'Authorization': 'Signature keyId="ondc-jatah.web.app|710|ed25519",algorithm="ed25519",created="1691124547",expires="1691128147",headers="(created) (expires) digest",signature="Gc2S8HYHZOOu3j2Shhho87oH0fxlZy8IhtDqxeG5QRdiejpaJgrO2EZRwx7c1O5jBZL8fplevIgU0OO6LOLTAg=="', 'Content-Type': 'application/json'}
      const response = await axios.post(url, raw_data, {
        headers: header,
      });

      return [response.data, response.status];
    } catch (error) {
      console.error(error);
      return [null, error.response.status];
    }
  }
}

module.exports = Middleware;
