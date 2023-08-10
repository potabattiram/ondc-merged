import sys
import json
import requests

def post_on_bg_or_bpp(url, payload, headers={}):
    print(f"Making POST call for {payload['context']['message_id']} on {url}")
    headers.update({'Content-Type': 'application/json'})
    raw_data = json.dumps(payload, separators=(',', ':'))
    response = requests.post(url, data=raw_data, headers=headers)
    response_text = response.text
    status_code = response.status_code
    return response_text, status_code

if __name__ == "__main__":
    url = sys.argv[1]
    payload = json.loads(sys.argv[2])
    headers = json.loads(sys.argv[3])
    print(payload,headers,url,'rtypsjsd')
    response_text, status_code = post_on_bg_or_bpp(url, payload, headers)
    print(json.dumps(response_text))
