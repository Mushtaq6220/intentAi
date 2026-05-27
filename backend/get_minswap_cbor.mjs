import fetch from 'node-fetch';
import { Transaction } from '@meshsdk/core';

async function run() {
  try {
    const sender = "addr1qx80gmw9ar6dshnghw0jrdpxz0r05q6jxts43ngcngvch7pfx6j8afrlqq8v0vquksx86e66c6f60z4k6j8wq5r637sqtcc4y0";
    
    // 1. Get estimate
    const estRes = await fetch('https://agg-api.minswap.org/aggregator/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: '1000000',
        token_in: 'lovelace',
        token_out: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e',
        slippage: 0.5
      })
    });
    const estData = await estRes.json();
    console.log("Estimate:", estData.min_amount_out);

    // 2. Build tx
    const buildRes = await fetch('https://agg-api.minswap.org/aggregator/build-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        min_amount_out: estData.min_amount_out,
        estimate: estData
      })
    });
    const buildData = await buildRes.json();
    
    if (buildData.cbor) {
      console.log("Got CBOR! Length:", buildData.cbor.length);
      // Wait, Transaction.readCbor might not exist, but let's just use regular expressions or CSL to decode it
      // Let's just output the CBOR and I can decode it using CSL in the script
      console.log("CBOR:", buildData.cbor);
    } else {
      console.log("Build failed:", buildData);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
