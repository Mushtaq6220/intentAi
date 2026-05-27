const fetch = require('node-fetch');

const estimate = {
  "token_in": "lovelace",
  "token_out": "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
  "amount_in": "1000000",
  "amount_out": "58079198",
  "min_amount_out": "57790246",
  "total_lp_fee": "3000",
  "total_dex_fee": "1900000",
  "deposits": "2000000",
  "avg_price_impact": 0.3194836973172077,
  "paths": [
    [
      {
        "lp_token": "a72dc0efe67f5bba75c782a30ee2f77cf3016b18c1af47942c321f67567946695f4144412f4d494e5f4c50",
        "token_in": "lovelace",
        "token_out": "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
        "amount_in": "1000000",
        "amount_out": "58079198",
        "min_amount_out": "57790246",
        "lp_fee": "3000",
        "dex_fee": "1900000",
        "deposits": "2000000",
        "price_impact": 0.3194836973172077,
        "pool_id": "a72dc0efe67f5bba75c782a30ee2f77cf3016b18c1af47942c321f67.567946695f4144412f4d494e5f4c50",
        "protocol": "VyFinance",
        "pool_out_ref": "202068250142ab51cdc5569b9f3f9b9a68d7f92d136f20d47010b223d5d891c8#0"
      }
    ]
  ],
  "aggregator_fee": "850000",
  "aggregator_fee_percent": 0.1,
  "amount_in_decimal": false
};

fetch('https://agg-api.minswap.org/aggregator/build-tx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sender: 'addr1qxgjsps05d5tnh4z8w8s996d93w33z3guxgff9r0k9s2hhsrtmz5zpx84lq4qf62tpsh5eug7u4f0dxtkqupt3kskswq7c97sq',
    min_amount_out: '57790246',
    estimate
  })
}).then(r => r.json()).then(console.log).catch(console.error);
