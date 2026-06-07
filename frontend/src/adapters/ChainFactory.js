import { CardanoAdapter } from "./CardanoAdapter";
import { BaseAdapter } from "./BaseAdapter";

export const ChainFactory = {
  get: (blockchainName) => {
    const name = String(blockchainName).toLowerCase();
    if (name === "base") {
      return BaseAdapter;
    }
    return CardanoAdapter;
  }
};
