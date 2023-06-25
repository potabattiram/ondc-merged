const nacl = require("tweetnacl");
const naclUtil = require("tweetnacl-util");
const axios = require('axios');

class Middleware {
  constructor() {}

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
  
 
  signResponse(signingKey, privateKey) {
    const privateKey64 = naclUtil.decodeBase64(privateKey);
    const signer = nacl.sign.keyPair.fromSecretKey(privateKey64);
    const signed = nacl.sign(naclUtil.decodeUTF8(signingKey), signer.secretKey);
    const signature = naclUtil.encodeBase64(signed);
    return signature;
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
      "G0lR0VyevpTH+atkzhktOWUWUu88U4niFZ5Uv5BgSEAV4l3ZEQIWqyBiiuAWKeu6d5mDYu4RC5BHR7dthF3Vzo==";
    const signature = this.signResponse(signingKey, privateKey);

    const subscriberId = "ondc.airpay.ninja";
    const uniqueKeyId = "242";
    const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;
    return header;
  }

  // NEW 

  async gatewaySearch(searchRequest) {
    const requestType = 'search';
    const gatewayUrl = await this.fetchSubscriberUrlFromLookup(requestType);
    const searchUrl = gatewayUrl.endsWith('/')
      ? `${gatewayUrl}${requestType}`
      : `${gatewayUrl}/${requestType}`;
    const authHeader = this.createAuthorizationHeader(searchRequest);
    console.log(`making request to bg or bpp with ${JSON.stringify(searchRequest)}`);
    return this.post_on_bg_or_bpp(searchUrl, { payload: searchRequest, headers: { Authorization: authHeader } });
  }
  
  async fetchSubscriberUrlFromLookup(requestType, subscriberId = null) {
    const subscriberType = requestType === 'search' ? 'BG' : 'BPP';
    const payload = {
      type: subscriberType,
      country: 'IND',
      domain: 'nic2004:52110',
    };
  
    if (subscriberId) {
      payload.subscriber_id = subscriberId;
    }
  
    const updatedPayload =
      process.env.ENV === 'pre_prod'
        ? this.formatRegistryRequestForPreProd(payload)
        : payload;
  
    const [response, statusCode] = await this.lookupCall(
      'https://pilot-gateway-1.beckn.nsdl.co.in/lookup',
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
        sender_subscriber_id: 'buyer-app.ondc.org',
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
    const signingString = reqObj.join('|');
    return signResponse(
      signingString,
      'lP3sHA+9gileOkXYJXh4Jg8tK0gEEMbf9yCPnFpbldhrAY+NErqL9WD+Vav7TE5tyVXGXBle9ONZi2W7o144eQ=='
    );
  }
  async post_on_bg_or_bpp(url, payload, headers = {}) {
    try {
      console.log(`Making POST call for ${payload.payload.context.message_id} on ${url}`);
      
      const updatedHeaders = {
        ...headers,
        'Content-Type': 'application/json',
      };
      
      const response = await axios.post(url, payload.payload, {
        headers: updatedHeaders,
        transformRequest: [(data) => JSON.stringify(data)],
      });
      
      return [response.data, response.status];
    } catch (error) {
      console.error(error);
      return [null, error.response.status];
    }
  }

 
}

module.exports = Middleware;




// const obj = new Middleware();
// console.log(obj.gatewaySearch({
//   "context": {
//     "city": "Bengaluru",
//     "action": "search",
//     "core_version": "1.1.0",
//     "transaction_id": "b9736615-695e-42d8-824b-69c1ed7e3abd",
//     "message_id": "ef95a77c-de53-4d3a-a3c3-64180458823a",
//     "timestamp": "2023-06-20T09:23:38.919Z",
//     "ttl": "PT30S"
//   },
//   "message": {
//     "intent": {
//       "fulfillment": {
//         "type": "Delivery"
//       },
//       "payment": {}
//     }
//   }
// }))

// console.log(obj.createAuthorizationHeader({
//   "context": {
//     "action": "search",
//     "core_version": "1.1.0",
//     "transaction_id": "2a5646e9-b640-4580-92c3-206832ceb181",
//     "message_id": "2be32b48-b43b-4cd4-b759-925b35c0a451",
//     "timestamp": "2023-06-16T06:14:51.020Z",
//     "ttl": "PT30S"
//   },
//   "message": {
//     "intent": {
//       "item": { "descriptor": { "name": "milk" } },
//       "fulfillment": {
//         "type": "Delivery",
//         "end": { "location": { "gps": "12.9236470000001,77.5861180000001" } }
//       },
//       "payment": {}
//     }
//   }
// }))
