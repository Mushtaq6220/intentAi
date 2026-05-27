import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import invariant from '@minswap/tiny-invariant';
import Big from 'big.js';
import BigNumber from 'bignumber.js';
import { zipWith } from 'remeda';
import { Constr, Addresses, Utils, Hasher, stakeCredentialOf, Crypto, Blockfrost, Lucid, Maestro, Data } from '@spacebudz/lucid';
import { SHA3 } from 'sha3';
import JSONBig from 'json-bigint';

var NetworkId = /* @__PURE__ */ ((NetworkId2) => {
  NetworkId2[NetworkId2["TESTNET"] = 0] = "TESTNET";
  NetworkId2[NetworkId2["MAINNET"] = 1] = "MAINNET";
  return NetworkId2;
})(NetworkId || {});
var NetworkEnvironment = /* @__PURE__ */ ((NetworkEnvironment2) => {
  NetworkEnvironment2[NetworkEnvironment2["MAINNET"] = 764824073] = "MAINNET";
  NetworkEnvironment2[NetworkEnvironment2["TESTNET_PREVIEW"] = 2] = "TESTNET_PREVIEW";
  NetworkEnvironment2[NetworkEnvironment2["TESTNET_PREPROD"] = 1] = "TESTNET_PREPROD";
  return NetworkEnvironment2;
})(NetworkEnvironment || {});

var LucidCredential;
((LucidCredential2) => {
  function toPlutusData(data) {
    const constructor = data.type === "Key" ? 0 : 1;
    return new Constr(constructor, [data.hash]);
  }
  LucidCredential2.toPlutusData = toPlutusData;
  function fromPlutusData(data) {
    switch (data.index) {
      case 0: {
        return {
          type: "Key",
          hash: data.fields[0]
        };
      }
      case 1: {
        return {
          type: "Script",
          hash: data.fields[0]
        };
      }
      default: {
        throw new Error(
          `Index of Credentail must be 0 or 1, actual: ${data.index}`
        );
      }
    }
  }
  LucidCredential2.fromPlutusData = fromPlutusData;
})(LucidCredential || (LucidCredential = {}));
var AddressPlutusData;
((AddressPlutusData2) => {
  function toPlutusData(address) {
    const addressDetails = Addresses.inspect(address);
    if (addressDetails.type === "Base") {
      invariant(
        addressDetails.payment && addressDetails.delegation,
        "baseAddress must have both paymentCredential and stakeCredential"
      );
      return new Constr(0, [
        LucidCredential.toPlutusData(addressDetails.payment),
        new Constr(0, [
          new Constr(0, [
            LucidCredential.toPlutusData(addressDetails.delegation)
          ])
        ])
      ]);
    }
    if (addressDetails.type === "Enterprise") {
      invariant(
        addressDetails.payment,
        "EnterpriseAddress must has paymentCredential"
      );
      return new Constr(0, [
        LucidCredential.toPlutusData(addressDetails.payment),
        new Constr(1, [])
      ]);
    }
    throw new Error("only supports base address, enterprise address");
  }
  AddressPlutusData2.toPlutusData = toPlutusData;
  function fromPlutusData(networkId, data) {
    switch (data.index) {
      case 0: {
        const paymentCredential = LucidCredential.fromPlutusData(
          data.fields[0]
        );
        const maybeStakeCredentialConstr = data.fields[1];
        switch (maybeStakeCredentialConstr.index) {
          case 0: {
            const stakeCredentialConstr = maybeStakeCredentialConstr.fields[0];
            switch (stakeCredentialConstr.index) {
              case 0: {
                const stakeCredential = LucidCredential.fromPlutusData(
                  stakeCredentialConstr.fields[0]
                );
                return Addresses.credentialToAddress(
                  networkId === NetworkId.MAINNET ? "Mainnet" : "Preprod",
                  paymentCredential,
                  stakeCredential
                );
              }
              case 1: {
                throw new Error(`Pointer Address has not been supported yet`);
              }
              default: {
                throw new Error(
                  `Index of StakeCredentail must be 0 or 1, actual: ${stakeCredentialConstr.index}`
                );
              }
            }
          }
          case 1: {
            return Addresses.credentialToAddress(
              networkId === NetworkId.MAINNET ? "Mainnet" : "Preprod",
              paymentCredential
            );
          }
          default: {
            throw new Error(
              `Index of Maybe Stake Credentail must be 0 or 1, actual: ${maybeStakeCredentialConstr.index}`
            );
          }
        }
      }
      default: {
        throw new Error(`Index of Address must be 0, actual: ${data.index}`);
      }
    }
  }
  AddressPlutusData2.fromPlutusData = fromPlutusData;
})(AddressPlutusData || (AddressPlutusData = {}));

var StringUtils;
((StringUtils2) => {
  function compare(s1, s2) {
    if (s1 < s2) {
      return -1;
    }
    if (s1 === s2) {
      return 0;
    }
    return 1;
  }
  StringUtils2.compare = compare;
})(StringUtils || (StringUtils = {}));

const ADA = {
  policyId: "",
  tokenName: ""
};
var Asset;
((Asset2) => {
  function fromString(s) {
    if (s === "lovelace") {
      return {
        policyId: "",
        tokenName: ""
      };
    }
    const policyId = s.slice(0, 56);
    const tokenName = s.slice(56);
    return {
      policyId,
      tokenName
    };
  }
  Asset2.fromString = fromString;
  function toString(asset) {
    const { policyId, tokenName } = asset;
    if (policyId === "" && tokenName === "") {
      return "lovelace";
    }
    return policyId + tokenName;
  }
  Asset2.toString = toString;
  function toDottedString(asset) {
    const { policyId, tokenName } = asset;
    if (policyId === "" && tokenName === "") {
      return "lovelace";
    }
    if (asset.tokenName === "") {
      return asset.policyId;
    }
    return `${asset.policyId}.${asset.tokenName}`;
  }
  Asset2.toDottedString = toDottedString;
  function toPlutusData(asset) {
    const { policyId, tokenName } = asset;
    return new Constr(0, [
      policyId,
      tokenName
    ]);
  }
  Asset2.toPlutusData = toPlutusData;
  function fromPlutusData(data) {
    if (data.index !== 0) {
      throw new Error(`Index of Asset must be 0, actual: ${data.index}`);
    }
    invariant(
      data.fields.length === 2,
      `Asset fields length must be 2, actual: ${data.fields.length}`
    );
    return {
      policyId: data.fields[0],
      tokenName: data.fields[1]
    };
  }
  Asset2.fromPlutusData = fromPlutusData;
  function compare(a1, a2) {
    if (a1.policyId === a2.policyId) {
      return StringUtils.compare(a1.tokenName, a2.tokenName);
    }
    return StringUtils.compare(a1.policyId, a2.policyId);
  }
  Asset2.compare = compare;
  function equals(a1, a2) {
    return a1.policyId === a2.policyId && a1.tokenName === a2.tokenName;
  }
  Asset2.equals = equals;
})(Asset || (Asset = {}));

var __defProp$d = Object.defineProperty;
var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$d = (obj, key, value) => __defNormalProp$d(obj, typeof key !== "symbol" ? key + "" : key, value);
var OrderV1;
((OrderV12) => {
  ((StepType2) => {
    StepType2[StepType2["SWAP_EXACT_IN"] = 0] = "SWAP_EXACT_IN";
    StepType2[StepType2["SWAP_EXACT_OUT"] = 1] = "SWAP_EXACT_OUT";
    StepType2[StepType2["DEPOSIT"] = 2] = "DEPOSIT";
    StepType2[StepType2["WITHDRAW"] = 3] = "WITHDRAW";
    StepType2[StepType2["ZAP_IN"] = 4] = "ZAP_IN";
  })(OrderV12.StepType || (OrderV12.StepType = {}));
  ((Datum2) => {
    function toPlutusData(datum) {
      const {
        sender,
        receiver,
        receiverDatumHash,
        step,
        batcherFee,
        depositADA
      } = datum;
      const senderConstr = AddressPlutusData.toPlutusData(sender);
      const receiverConstr = AddressPlutusData.toPlutusData(receiver);
      const receiverDatumHashConstr = receiverDatumHash ? new Constr(0, [receiverDatumHash]) : new Constr(1, []);
      let datumConstr;
      switch (step.type) {
        case 0 /* SWAP_EXACT_IN */: {
          datumConstr = new Constr(0, [
            senderConstr,
            receiverConstr,
            receiverDatumHashConstr,
            new Constr(0 /* SWAP_EXACT_IN */, [
              Asset.toPlutusData(step.desiredAsset),
              step.minimumReceived
            ]),
            batcherFee,
            depositADA
          ]);
          break;
        }
        case 1 /* SWAP_EXACT_OUT */: {
          datumConstr = new Constr(0, [
            senderConstr,
            receiverConstr,
            receiverDatumHashConstr,
            new Constr(1 /* SWAP_EXACT_OUT */, [
              Asset.toPlutusData(step.desiredAsset),
              step.expectedReceived
            ]),
            batcherFee,
            depositADA
          ]);
          break;
        }
        case 2 /* DEPOSIT */: {
          datumConstr = new Constr(0, [
            senderConstr,
            receiverConstr,
            receiverDatumHashConstr,
            new Constr(2 /* DEPOSIT */, [step.minimumLP]),
            batcherFee,
            depositADA
          ]);
          break;
        }
        case 3 /* WITHDRAW */: {
          datumConstr = new Constr(0, [
            senderConstr,
            receiverConstr,
            receiverDatumHashConstr,
            new Constr(3 /* WITHDRAW */, [
              step.minimumAssetA,
              step.minimumAssetB
            ]),
            batcherFee,
            depositADA
          ]);
          break;
        }
        case 4 /* ZAP_IN */: {
          datumConstr = new Constr(0, [
            senderConstr,
            receiverConstr,
            receiverDatumHashConstr,
            new Constr(4 /* ZAP_IN */, [
              Asset.toPlutusData(step.desiredAsset),
              step.minimumLP
            ]),
            batcherFee,
            depositADA
          ]);
          break;
        }
      }
      return datumConstr;
    }
    Datum2.toPlutusData = toPlutusData;
    function fromPlutusData(networkId, data) {
      if (data.index !== 0) {
        throw new Error(
          `Index of Order Datum must be 0, actual: ${data.index}`
        );
      }
      const sender = AddressPlutusData.fromPlutusData(
        networkId,
        data.fields[0]
      );
      const receiver = AddressPlutusData.fromPlutusData(
        networkId,
        data.fields[1]
      );
      let receiverDatumHash = void 0;
      const maybeReceiverDatumHash = data.fields[2];
      switch (maybeReceiverDatumHash.index) {
        case 0: {
          receiverDatumHash = maybeReceiverDatumHash.fields[0];
          break;
        }
        case 1: {
          receiverDatumHash = void 0;
          break;
        }
        default: {
          throw new Error(
            `Index of Receiver Datum Hash must be 0 or 1, actual: ${maybeReceiverDatumHash.index}`
          );
        }
      }
      let step;
      const orderStepConstr = data.fields[3];
      switch (orderStepConstr.index) {
        case 0 /* SWAP_EXACT_IN */: {
          step = {
            type: 0 /* SWAP_EXACT_IN */,
            desiredAsset: Asset.fromPlutusData(
              orderStepConstr.fields[0]
            ),
            minimumReceived: orderStepConstr.fields[1]
          };
          break;
        }
        case 1 /* SWAP_EXACT_OUT */: {
          step = {
            type: 1 /* SWAP_EXACT_OUT */,
            desiredAsset: Asset.fromPlutusData(
              orderStepConstr.fields[0]
            ),
            expectedReceived: orderStepConstr.fields[1]
          };
          break;
        }
        case 2 /* DEPOSIT */: {
          step = {
            type: 2 /* DEPOSIT */,
            minimumLP: orderStepConstr.fields[0]
          };
          break;
        }
        case 3 /* WITHDRAW */: {
          step = {
            type: 3 /* WITHDRAW */,
            minimumAssetA: orderStepConstr.fields[0],
            minimumAssetB: orderStepConstr.fields[1]
          };
          break;
        }
        case 4 /* ZAP_IN */: {
          step = {
            type: 4 /* ZAP_IN */,
            desiredAsset: Asset.fromPlutusData(
              orderStepConstr.fields[0]
            ),
            minimumLP: orderStepConstr.fields[1]
          };
          break;
        }
        default: {
          throw new Error(
            `Index of Order Step must be in 0-4, actual: ${orderStepConstr.index}`
          );
        }
      }
      const batcherFee = data.fields[4];
      const depositADA = data.fields[5];
      return {
        sender,
        receiver,
        receiverDatumHash,
        step,
        batcherFee,
        depositADA
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
  })(OrderV12.Datum || (OrderV12.Datum = {}));
  ((Redeemer2) => {
    Redeemer2[Redeemer2["APPLY_ORDER"] = 0] = "APPLY_ORDER";
    Redeemer2[Redeemer2["CANCEL_ORDER"] = 1] = "CANCEL_ORDER";
  })(OrderV12.Redeemer || (OrderV12.Redeemer = {}));
})(OrderV1 || (OrderV1 = {}));
var StableOrder;
((StableOrder2) => {
  ((StepType2) => {
    StepType2[StepType2["SWAP"] = 0] = "SWAP";
    StepType2[StepType2["DEPOSIT"] = 1] = "DEPOSIT";
    StepType2[StepType2["WITHDRAW"] = 2] = "WITHDRAW";
    StepType2[StepType2["WITHDRAW_IMBALANCE"] = 3] = "WITHDRAW_IMBALANCE";
    StepType2[StepType2["ZAP_OUT"] = 4] = "ZAP_OUT";
  })(StableOrder2.StepType || (StableOrder2.StepType = {}));
  ((Datum2) => {
    function toPlutusData(datum) {
      const {
        sender,
        receiver,
        receiverDatumHash,
        step,
        batcherFee,
        depositADA
      } = datum;
      const senderConstr = AddressPlutusData.toPlutusData(sender);
      const receiverConstr = AddressPlutusData.toPlutusData(receiver);
      const receiverDatumHashConstr = receiverDatumHash ? new Constr(0, [receiverDatumHash]) : new Constr(1, []);
      let stepConstr;
      switch (step.type) {
        case 0 /* SWAP */: {
          stepConstr = new Constr(0 /* SWAP */, [
            step.assetInIndex,
            step.assetOutIndex,
            step.minimumAssetOut
          ]);
          break;
        }
        case 1 /* DEPOSIT */: {
          stepConstr = new Constr(1 /* DEPOSIT */, [step.minimumLP]);
          break;
        }
        case 2 /* WITHDRAW */: {
          stepConstr = new Constr(2 /* WITHDRAW */, [step.minimumAmounts]);
          break;
        }
        case 3 /* WITHDRAW_IMBALANCE */: {
          stepConstr = new Constr(3 /* WITHDRAW_IMBALANCE */, [
            step.withdrawAmounts
          ]);
          break;
        }
        case 4 /* ZAP_OUT */: {
          stepConstr = new Constr(4 /* ZAP_OUT */, [
            step.assetOutIndex,
            step.minimumAssetOut
          ]);
          break;
        }
      }
      return new Constr(0, [
        senderConstr,
        receiverConstr,
        receiverDatumHashConstr,
        stepConstr,
        batcherFee,
        depositADA
      ]);
    }
    Datum2.toPlutusData = toPlutusData;
    function fromPlutusData(networkId, data) {
      if (data.index !== 0) {
        throw new Error(
          `Index of Order Datum must be 0, actual: ${data.index}`
        );
      }
      const sender = AddressPlutusData.fromPlutusData(
        networkId,
        data.fields[0]
      );
      const receiver = AddressPlutusData.fromPlutusData(
        networkId,
        data.fields[1]
      );
      let receiverDatumHash = void 0;
      const maybeReceiverDatumHash = data.fields[2];
      switch (maybeReceiverDatumHash.index) {
        case 0: {
          receiverDatumHash = maybeReceiverDatumHash.fields[0];
          break;
        }
        case 1: {
          receiverDatumHash = void 0;
          break;
        }
        default: {
          throw new Error(
            `Index of Receiver Datum Hash must be 0 or 1, actual: ${maybeReceiverDatumHash.index}`
          );
        }
      }
      let step;
      const orderStepConstr = data.fields[3];
      switch (orderStepConstr.index) {
        case 0 /* SWAP */: {
          step = {
            type: 0 /* SWAP */,
            assetInIndex: orderStepConstr.fields[0],
            assetOutIndex: orderStepConstr.fields[1],
            minimumAssetOut: orderStepConstr.fields[2]
          };
          break;
        }
        case 1 /* DEPOSIT */: {
          step = {
            type: 1 /* DEPOSIT */,
            minimumLP: orderStepConstr.fields[0]
          };
          break;
        }
        case 2 /* WITHDRAW */: {
          step = {
            type: 2 /* WITHDRAW */,
            minimumAmounts: orderStepConstr.fields[0]
          };
          break;
        }
        case 3 /* WITHDRAW_IMBALANCE */: {
          step = {
            type: 3 /* WITHDRAW_IMBALANCE */,
            withdrawAmounts: orderStepConstr.fields[0]
          };
          break;
        }
        case 4 /* ZAP_OUT */: {
          step = {
            type: 4 /* ZAP_OUT */,
            assetOutIndex: orderStepConstr.fields[0],
            minimumAssetOut: orderStepConstr.fields[1]
          };
          break;
        }
        default: {
          throw new Error(
            `Index of Order Step must be in 0-4, actual: ${orderStepConstr.index}`
          );
        }
      }
      const batcherFee = data.fields[4];
      const depositADA = data.fields[5];
      return {
        sender,
        receiver,
        receiverDatumHash,
        step,
        batcherFee,
        depositADA
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
  })(StableOrder2.Datum || (StableOrder2.Datum = {}));
  ((Redeemer2) => {
    Redeemer2[Redeemer2["APPLY_ORDER"] = 0] = "APPLY_ORDER";
    Redeemer2[Redeemer2["CANCEL_ORDER"] = 1] = "CANCEL_ORDER";
  })(StableOrder2.Redeemer || (StableOrder2.Redeemer = {}));
})(StableOrder || (StableOrder = {}));
var OrderV2;
((OrderV22) => {
  ((AuthorizationMethodType2) => {
    AuthorizationMethodType2[AuthorizationMethodType2["SIGNATURE"] = 0] = "SIGNATURE";
    AuthorizationMethodType2[AuthorizationMethodType2["SPEND_SCRIPT"] = 1] = "SPEND_SCRIPT";
    AuthorizationMethodType2[AuthorizationMethodType2["WITHDRAW_SCRIPT"] = 2] = "WITHDRAW_SCRIPT";
    AuthorizationMethodType2[AuthorizationMethodType2["MINT_SCRIPT"] = 3] = "MINT_SCRIPT";
  })(OrderV22.AuthorizationMethodType || (OrderV22.AuthorizationMethodType = {}));
  let AuthorizationMethod;
  ((AuthorizationMethod2) => {
    function fromPlutusData(data) {
      let type;
      if (data.fields.length !== 1) {
        throw Error(
          `Field length of AuthorizationMethod must be in 1, actual: ${data.fields.length}`
        );
      }
      switch (data.index) {
        case 0 /* SIGNATURE */: {
          type = 0 /* SIGNATURE */;
          break;
        }
        case 1 /* SPEND_SCRIPT */: {
          type = 1 /* SPEND_SCRIPT */;
          break;
        }
        case 2 /* WITHDRAW_SCRIPT */: {
          type = 2 /* WITHDRAW_SCRIPT */;
          break;
        }
        case 3 /* MINT_SCRIPT */: {
          type = 3 /* MINT_SCRIPT */;
          break;
        }
        default: {
          throw new Error(
            `Index of AuthorizationMethod must be in 0-3, actual: ${data.index}`
          );
        }
      }
      return {
        type,
        hash: data.fields[0]
      };
    }
    AuthorizationMethod2.fromPlutusData = fromPlutusData;
    function toPlutusData(method) {
      return new Constr(method.type, [method.hash]);
    }
    AuthorizationMethod2.toPlutusData = toPlutusData;
  })(AuthorizationMethod = OrderV22.AuthorizationMethod || (OrderV22.AuthorizationMethod = {}));
  let Direction;
  ((Direction2) => {
    Direction2[Direction2["B_TO_A"] = 0] = "B_TO_A";
    Direction2[Direction2["A_TO_B"] = 1] = "A_TO_B";
  })(Direction = OrderV22.Direction || (OrderV22.Direction = {}));
  ((Direction2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* B_TO_A */: {
          return 0 /* B_TO_A */;
        }
        case 1 /* A_TO_B */: {
          return 1 /* A_TO_B */;
        }
        default: {
          throw new Error(
            `Index of Direction must be in 0-1, actual: ${data.index}`
          );
        }
      }
    }
    Direction2.fromPlutusData = fromPlutusData;
    function toPlutusData(direction) {
      return new Constr(direction, []);
    }
    Direction2.toPlutusData = toPlutusData;
  })(Direction = OrderV22.Direction || (OrderV22.Direction = {}));
  let Killable;
  ((Killable2) => {
    Killable2[Killable2["PENDING_ON_FAILED"] = 0] = "PENDING_ON_FAILED";
    Killable2[Killable2["KILL_ON_FAILED"] = 1] = "KILL_ON_FAILED";
  })(Killable = OrderV22.Killable || (OrderV22.Killable = {}));
  ((Killable2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* PENDING_ON_FAILED */: {
          return 0 /* PENDING_ON_FAILED */;
        }
        case 1 /* KILL_ON_FAILED */: {
          return 1 /* KILL_ON_FAILED */;
        }
        default: {
          throw new Error(
            `Index of Killable must be in 0-1, actual: ${data.index}`
          );
        }
      }
    }
    Killable2.fromPlutusData = fromPlutusData;
    function toPlutusData(killable) {
      return new Constr(killable, []);
    }
    Killable2.toPlutusData = toPlutusData;
  })(Killable = OrderV22.Killable || (OrderV22.Killable = {}));
  ((AmountType2) => {
    AmountType2[AmountType2["SPECIFIC_AMOUNT"] = 0] = "SPECIFIC_AMOUNT";
    AmountType2[AmountType2["ALL"] = 1] = "ALL";
  })(OrderV22.AmountType || (OrderV22.AmountType = {}));
  let DepositAmount;
  ((DepositAmount2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* SPECIFIC_AMOUNT */: {
          return {
            type: 0 /* SPECIFIC_AMOUNT */,
            depositAmountA: data.fields[0],
            depositAmountB: data.fields[1]
          };
        }
        case 1 /* ALL */: {
          return {
            type: 1 /* ALL */,
            deductedAmountA: data.fields[0],
            deductedAmountB: data.fields[1]
          };
        }
        default: {
          throw new Error(
            `Index of DepositAmount must be in 0-1, actual: ${data.index}`
          );
        }
      }
    }
    DepositAmount2.fromPlutusData = fromPlutusData;
    function toPlutusData(amount) {
      switch (amount.type) {
        case 0 /* SPECIFIC_AMOUNT */: {
          return new Constr(0 /* SPECIFIC_AMOUNT */, [
            amount.depositAmountA,
            amount.depositAmountB
          ]);
        }
        case 1 /* ALL */: {
          return new Constr(1 /* ALL */, [
            amount.deductedAmountA,
            amount.deductedAmountB
          ]);
        }
      }
    }
    DepositAmount2.toPlutusData = toPlutusData;
  })(DepositAmount = OrderV22.DepositAmount || (OrderV22.DepositAmount = {}));
  let SwapAmount;
  ((SwapAmount2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* SPECIFIC_AMOUNT */: {
          return {
            type: 0 /* SPECIFIC_AMOUNT */,
            swapAmount: data.fields[0]
          };
        }
        case 1 /* ALL */: {
          return {
            type: 1 /* ALL */,
            deductedAmount: data.fields[0]
          };
        }
        default: {
          throw new Error(
            `Index of SwapAmount must be in 0-1, actual: ${data.index}`
          );
        }
      }
    }
    SwapAmount2.fromPlutusData = fromPlutusData;
    function toPlutusData(amount) {
      switch (amount.type) {
        case 0 /* SPECIFIC_AMOUNT */: {
          return new Constr(0 /* SPECIFIC_AMOUNT */, [amount.swapAmount]);
        }
        case 1 /* ALL */: {
          return new Constr(1 /* ALL */, [amount.deductedAmount]);
        }
      }
    }
    SwapAmount2.toPlutusData = toPlutusData;
  })(SwapAmount = OrderV22.SwapAmount || (OrderV22.SwapAmount = {}));
  let WithdrawAmount;
  ((WithdrawAmount2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* SPECIFIC_AMOUNT */: {
          return {
            type: 0 /* SPECIFIC_AMOUNT */,
            withdrawalLPAmount: data.fields[0]
          };
        }
        case 1 /* ALL */: {
          return {
            type: 1 /* ALL */,
            deductedLPAmount: data.fields[0]
          };
        }
        default: {
          throw new Error(
            `Index of WithdrawAmount must be in 0-1, actual: ${data.index}`
          );
        }
      }
    }
    WithdrawAmount2.fromPlutusData = fromPlutusData;
    function toPlutusData(amount) {
      switch (amount.type) {
        case 0 /* SPECIFIC_AMOUNT */: {
          return new Constr(0 /* SPECIFIC_AMOUNT */, [
            amount.withdrawalLPAmount
          ]);
        }
        case 1 /* ALL */: {
          return new Constr(1 /* ALL */, [amount.deductedLPAmount]);
        }
      }
    }
    WithdrawAmount2.toPlutusData = toPlutusData;
  })(WithdrawAmount = OrderV22.WithdrawAmount || (OrderV22.WithdrawAmount = {}));
  let Route;
  ((Route2) => {
    function fromPlutusData(data) {
      if (data.index !== 0) {
        throw new Error(
          `Index of Order Route must be 0, actual: ${data.index}`
        );
      }
      return {
        lpAsset: Asset.fromPlutusData(data.fields[0]),
        direction: Direction.fromPlutusData(data.fields[1])
      };
    }
    Route2.fromPlutusData = fromPlutusData;
    function toPlutusData(route) {
      return new Constr(0, [
        Asset.toPlutusData(route.lpAsset),
        Direction.toPlutusData(route.direction)
      ]);
    }
    Route2.toPlutusData = toPlutusData;
  })(Route = OrderV22.Route || (OrderV22.Route = {}));
  ((StepType2) => {
    StepType2[StepType2["SWAP_EXACT_IN"] = 0] = "SWAP_EXACT_IN";
    StepType2[StepType2["STOP"] = 1] = "STOP";
    StepType2[StepType2["OCO"] = 2] = "OCO";
    StepType2[StepType2["SWAP_EXACT_OUT"] = 3] = "SWAP_EXACT_OUT";
    StepType2[StepType2["DEPOSIT"] = 4] = "DEPOSIT";
    StepType2[StepType2["WITHDRAW"] = 5] = "WITHDRAW";
    StepType2[StepType2["ZAP_OUT"] = 6] = "ZAP_OUT";
    StepType2[StepType2["PARTIAL_SWAP"] = 7] = "PARTIAL_SWAP";
    StepType2[StepType2["WITHDRAW_IMBALANCE"] = 8] = "WITHDRAW_IMBALANCE";
    StepType2[StepType2["SWAP_ROUTING"] = 9] = "SWAP_ROUTING";
    StepType2[StepType2["DONATION"] = 10] = "DONATION";
  })(OrderV22.StepType || (OrderV22.StepType = {}));
  let Step;
  ((Step2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* SWAP_EXACT_IN */: {
          return {
            type: 0 /* SWAP_EXACT_IN */,
            direction: Direction.fromPlutusData(data.fields[0]),
            swapAmount: SwapAmount.fromPlutusData(
              data.fields[1]
            ),
            minimumReceived: data.fields[2],
            killable: Killable.fromPlutusData(data.fields[3])
          };
        }
        case 1 /* STOP */: {
          return {
            type: 1 /* STOP */,
            direction: Direction.fromPlutusData(data.fields[0]),
            swapAmount: SwapAmount.fromPlutusData(
              data.fields[1]
            ),
            stopReceived: data.fields[2]
          };
        }
        case 2 /* OCO */: {
          return {
            type: 2 /* OCO */,
            direction: Direction.fromPlutusData(data.fields[0]),
            swapAmount: SwapAmount.fromPlutusData(
              data.fields[1]
            ),
            minimumReceived: data.fields[2],
            stopReceived: data.fields[3]
          };
        }
        case 3 /* SWAP_EXACT_OUT */: {
          return {
            type: 3 /* SWAP_EXACT_OUT */,
            direction: Direction.fromPlutusData(data.fields[0]),
            maximumSwapAmount: SwapAmount.fromPlutusData(
              data.fields[1]
            ),
            expectedReceived: data.fields[2],
            killable: Killable.fromPlutusData(data.fields[3])
          };
        }
        case 4 /* DEPOSIT */: {
          return {
            type: 4 /* DEPOSIT */,
            depositAmount: DepositAmount.fromPlutusData(
              data.fields[0]
            ),
            minimumLP: data.fields[1],
            killable: Killable.fromPlutusData(data.fields[2])
          };
        }
        case 5 /* WITHDRAW */: {
          return {
            type: 5 /* WITHDRAW */,
            withdrawalAmount: WithdrawAmount.fromPlutusData(
              data.fields[0]
            ),
            minimumAssetA: data.fields[1],
            minimumAssetB: data.fields[2],
            killable: Killable.fromPlutusData(data.fields[3])
          };
        }
        case 6 /* ZAP_OUT */: {
          return {
            type: 6 /* ZAP_OUT */,
            direction: Direction.fromPlutusData(data.fields[0]),
            withdrawalAmount: WithdrawAmount.fromPlutusData(
              data.fields[1]
            ),
            minimumReceived: data.fields[2],
            killable: Killable.fromPlutusData(data.fields[3])
          };
        }
        case 7 /* PARTIAL_SWAP */: {
          return {
            type: 7 /* PARTIAL_SWAP */,
            direction: Direction.fromPlutusData(data.fields[0]),
            totalSwapAmount: data.fields[1],
            ioRatioNumerator: data.fields[2],
            ioRatioDenominator: data.fields[3],
            hops: data.fields[4],
            minimumSwapAmountRequired: data.fields[5],
            maxBatcherFeeEachTime: data.fields[6]
          };
        }
        case 8 /* WITHDRAW_IMBALANCE */: {
          return {
            type: 8 /* WITHDRAW_IMBALANCE */,
            withdrawalAmount: WithdrawAmount.fromPlutusData(
              data.fields[0]
            ),
            ratioAssetA: data.fields[1],
            ratioAssetB: data.fields[2],
            minimumAssetA: data.fields[3],
            killable: Killable.fromPlutusData(data.fields[4])
          };
        }
        case 9 /* SWAP_ROUTING */: {
          return {
            type: 9 /* SWAP_ROUTING */,
            routings: data.fields[0].map(
              Route.fromPlutusData
            ),
            swapAmount: SwapAmount.fromPlutusData(
              data.fields[1]
            ),
            minimumReceived: data.fields[2]
          };
        }
        case 10 /* DONATION */: {
          return {
            type: 10 /* DONATION */
          };
        }
        default: {
          throw new Error(
            `Index of Step must be in 0-10, actual: ${data.index}`
          );
        }
      }
    }
    Step2.fromPlutusData = fromPlutusData;
    function toPlutusData(step) {
      switch (step.type) {
        case 0 /* SWAP_EXACT_IN */: {
          return new Constr(step.type, [
            Direction.toPlutusData(step.direction),
            SwapAmount.toPlutusData(step.swapAmount),
            step.minimumReceived,
            Killable.toPlutusData(step.killable)
          ]);
        }
        case 1 /* STOP */: {
          return new Constr(step.type, [
            Direction.toPlutusData(step.direction),
            SwapAmount.toPlutusData(step.swapAmount),
            step.stopReceived
          ]);
        }
        case 2 /* OCO */: {
          return new Constr(step.type, [
            Direction.toPlutusData(step.direction),
            SwapAmount.toPlutusData(step.swapAmount),
            step.minimumReceived,
            step.stopReceived
          ]);
        }
        case 3 /* SWAP_EXACT_OUT */: {
          return new Constr(step.type, [
            Direction.toPlutusData(step.direction),
            SwapAmount.toPlutusData(step.maximumSwapAmount),
            step.expectedReceived,
            Killable.toPlutusData(step.killable)
          ]);
        }
        case 4 /* DEPOSIT */: {
          return new Constr(step.type, [
            DepositAmount.toPlutusData(step.depositAmount),
            step.minimumLP,
            Killable.toPlutusData(step.killable)
          ]);
        }
        case 5 /* WITHDRAW */: {
          return new Constr(step.type, [
            WithdrawAmount.toPlutusData(step.withdrawalAmount),
            step.minimumAssetA,
            step.minimumAssetB,
            Killable.toPlutusData(step.killable)
          ]);
        }
        case 6 /* ZAP_OUT */: {
          return new Constr(step.type, [
            Direction.toPlutusData(step.direction),
            WithdrawAmount.toPlutusData(step.withdrawalAmount),
            step.minimumReceived,
            Killable.toPlutusData(step.killable)
          ]);
        }
        case 7 /* PARTIAL_SWAP */: {
          return new Constr(step.type, [
            Direction.toPlutusData(step.direction),
            step.totalSwapAmount,
            step.ioRatioNumerator,
            step.ioRatioDenominator,
            step.hops,
            step.minimumSwapAmountRequired,
            step.maxBatcherFeeEachTime
          ]);
        }
        case 8 /* WITHDRAW_IMBALANCE */: {
          return new Constr(step.type, [
            WithdrawAmount.toPlutusData(step.withdrawalAmount),
            step.ratioAssetA,
            step.ratioAssetB,
            step.minimumAssetA,
            Killable.toPlutusData(step.killable)
          ]);
        }
        case 9 /* SWAP_ROUTING */: {
          return new Constr(step.type, [
            step.routings.map(Route.toPlutusData),
            SwapAmount.toPlutusData(step.swapAmount),
            step.minimumReceived
          ]);
        }
        case 10 /* DONATION */: {
          return new Constr(step.type, []);
        }
      }
    }
    Step2.toPlutusData = toPlutusData;
  })(Step = OrderV22.Step || (OrderV22.Step = {}));
  ((ExtraDatumType2) => {
    ExtraDatumType2[ExtraDatumType2["NO_DATUM"] = 0] = "NO_DATUM";
    ExtraDatumType2[ExtraDatumType2["DATUM_HASH"] = 1] = "DATUM_HASH";
    ExtraDatumType2[ExtraDatumType2["INLINE_DATUM"] = 2] = "INLINE_DATUM";
  })(OrderV22.ExtraDatumType || (OrderV22.ExtraDatumType = {}));
  let ExtraDatum;
  ((ExtraDatum2) => {
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* NO_DATUM */: {
          invariant(
            data.fields.length === 0,
            `Field Length of ExtraDatum.NO_DATUM must be 0, actually ${data.fields.length}`
          );
          return {
            type: 0 /* NO_DATUM */
          };
        }
        case 1 /* DATUM_HASH */: {
          invariant(
            data.fields.length === 1,
            `Field Length of ExtraDatum.DATUM_HASH must be 1, actually ${data.fields.length}`
          );
          return {
            type: 1 /* DATUM_HASH */,
            hash: data.fields[0]
          };
        }
        case 2 /* INLINE_DATUM */: {
          invariant(
            data.fields.length === 1,
            `Field Length of ExtraDatum.INLINE_DATUM must be 1, actually ${data.fields.length}`
          );
          return {
            type: 2 /* INLINE_DATUM */,
            hash: data.fields[0]
          };
        }
        default: {
          throw new Error(
            `Index of ExtraDatum must be in 0-2, actual: ${data.index}`
          );
        }
      }
    }
    ExtraDatum2.fromPlutusData = fromPlutusData;
    function toPlutusData(extraDatum) {
      switch (extraDatum.type) {
        case 0 /* NO_DATUM */: {
          return new Constr(extraDatum.type, []);
        }
        case 1 /* DATUM_HASH */: {
          return new Constr(extraDatum.type, [extraDatum.hash]);
        }
        case 2 /* INLINE_DATUM */: {
          return new Constr(extraDatum.type, [extraDatum.hash]);
        }
      }
    }
    ExtraDatum2.toPlutusData = toPlutusData;
  })(ExtraDatum = OrderV22.ExtraDatum || (OrderV22.ExtraDatum = {}));
  let Datum;
  ((Datum2) => {
    function fromPlutusData(networkId, data) {
      if (data.index !== 0) {
        throw new Error(
          `Index of Order Datum must be 0, actual: ${data.index}`
        );
      }
      if (data.fields.length !== 9) {
        throw new Error(
          `Fields Length of Order Datum must be 9, actual: ${data.index}`
        );
      }
      const maybeExpiry = data.fields[8];
      let expiry;
      switch (maybeExpiry.index) {
        case 0: {
          if (maybeExpiry.fields.length !== 1) {
            throw new Error(
              `Order maybeExpiry length must have 1 field, actual: ${maybeExpiry.fields.length}`
            );
          }
          if (!Array.isArray(maybeExpiry.fields[0]) || maybeExpiry.fields[0].length !== 2) {
            throw new Error(
              `maybeExpiry field0's length must be 2-element array, actual: ${maybeExpiry.fields[0]}`
            );
          }
          expiry = maybeExpiry.fields[0];
          break;
        }
        case 1: {
          expiry = void 0;
          if (maybeExpiry.fields.length !== 0) {
            throw new Error(
              `Order undefined Expiry must have 0 elements, actual: ${maybeExpiry.fields.length}`
            );
          }
          break;
        }
        default: {
          throw new Error(
            `Index of Maybe Expiry must be 0 or 1, actual: ${maybeExpiry.index}`
          );
        }
      }
      return {
        canceller: AuthorizationMethod.fromPlutusData(
          data.fields[0]
        ),
        refundReceiver: AddressPlutusData.fromPlutusData(
          networkId,
          data.fields[1]
        ),
        refundReceiverDatum: ExtraDatum.fromPlutusData(
          data.fields[2]
        ),
        successReceiver: AddressPlutusData.fromPlutusData(
          networkId,
          data.fields[3]
        ),
        successReceiverDatum: ExtraDatum.fromPlutusData(
          data.fields[4]
        ),
        lpAsset: Asset.fromPlutusData(data.fields[5]),
        step: Step.fromPlutusData(data.fields[6]),
        maxBatcherFee: data.fields[7],
        expiredOptions: expiry ? {
          expiredTime: expiry[0],
          maxCancellationTip: expiry[1]
        } : void 0
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
    function toPlutusData(datum) {
      return new Constr(0, [
        AuthorizationMethod.toPlutusData(datum.canceller),
        AddressPlutusData.toPlutusData(datum.refundReceiver),
        ExtraDatum.toPlutusData(datum.refundReceiverDatum),
        AddressPlutusData.toPlutusData(datum.successReceiver),
        ExtraDatum.toPlutusData(datum.successReceiverDatum),
        Asset.toPlutusData(datum.lpAsset),
        Step.toPlutusData(datum.step),
        datum.maxBatcherFee,
        datum.expiredOptions ? new Constr(0, [
          [
            datum.expiredOptions.expiredTime,
            datum.expiredOptions.maxCancellationTip
          ]
        ]) : new Constr(1, [])
      ]);
    }
    Datum2.toPlutusData = toPlutusData;
  })(Datum = OrderV22.Datum || (OrderV22.Datum = {}));
  ((Redeemer2) => {
    Redeemer2[Redeemer2["APPLY_ORDER"] = 0] = "APPLY_ORDER";
    Redeemer2[Redeemer2["CANCEL_ORDER_BY_OWNER"] = 1] = "CANCEL_ORDER_BY_OWNER";
    Redeemer2[Redeemer2["CANCEL_EXPIRED_ORDER_BY_ANYONE"] = 2] = "CANCEL_EXPIRED_ORDER_BY_ANYONE";
  })(OrderV22.Redeemer || (OrderV22.Redeemer = {}));
  class State {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$d(this, "address");
      __publicField$d(this, "txIn");
      __publicField$d(this, "value");
      __publicField$d(this, "datumCbor");
      __publicField$d(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = Datum.fromPlutusData(networkId, DataObject.from(datum));
    }
  }
  OrderV22.State = State;
})(OrderV2 || (OrderV2 = {}));

function sha3(hex) {
  const hash = new SHA3(256);
  hash.update(hex, "hex");
  return hash.digest("hex");
}

var DexV1Constant;
((DexV1Constant2) => {
  DexV1Constant2.ORDER_BASE_ADDRESS = {
    [NetworkId.TESTNET]: "addr_test1zzn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uwurajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upq932hcy",
    [NetworkId.MAINNET]: "addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70"
  };
  DexV1Constant2.POOL_SCRIPT_HASH = "script1uychk9f04tqngfhx4qlqdlug5ntzen3uzc62kzj7cyesjk0d9me";
  DexV1Constant2.FACTORY_POLICY_ID = "13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f";
  DexV1Constant2.FACTORY_ASSET_NAME = "4d494e53574150";
  DexV1Constant2.LP_POLICY_ID = "e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86";
  DexV1Constant2.POOL_NFT_POLICY_ID = "0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1";
  DexV1Constant2.ORDER_SCRIPT = {
    type: "PlutusV1",
    script: "59014f59014c01000032323232323232322223232325333009300e30070021323233533300b3370e9000180480109118011bae30100031225001232533300d3300e22533301300114a02a66601e66ebcc04800400c5288980118070009bac3010300c300c300c300c300c300c300c007149858dd48008b18060009baa300c300b3754601860166ea80184ccccc0288894ccc04000440084c8c94ccc038cd4ccc038c04cc030008488c008dd718098018912800919b8f0014891ce1317b152faac13426e6a83e06ff88a4d62cce3c1634ab0a5ec133090014a0266008444a00226600a446004602600a601a00626600a008601a006601e0026ea8c03cc038dd5180798071baa300f300b300e3754601e00244a0026eb0c03000c92616300a001375400660106ea8c024c020dd5000aab9d5744ae688c8c0088cc0080080048c0088cc00800800555cf2ba15573e6e1d200201"
  };
})(DexV1Constant || (DexV1Constant = {}));
var StableswapConstant;
((StableswapConstant2) => {
  StableswapConstant2.CONFIG = {
    [NetworkId.TESTNET]: [
      {
        orderAddress: "addr_test1zq8spknltt6yyz2505rhc5lqw89afc4anhu4u0347n5dz8urajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqa63kst",
        poolAddress: "addr_test1zr3hs60rn9x49ahuduuzmnlhnema0jsl4d3ujrf3cmurhmvrajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqcgz9yc",
        nftAsset: "06fe1ba957728130154154d5e5b25a7b533ebe6c4516356c0aa69355646a65642d697573642d76312e342d6c70",
        lpAsset: "d16339238c9e1fb4d034b6a48facb2f97794a9cdb7bc049dd7c49f54646a65642d697573642d76312e342d6c70",
        assets: [
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed7274444a4544",
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed727469555344"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr_test1zp3mf7r63u8km2d69kh6v2axlvl04yunmmj67vprljuht4urajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqhelj6n",
        poolAddress: "addr_test1zzc8ar93kgntz3lv95uauhe29kj4yj84mxhg5v9dqj4k7p5rajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqujv25l",
        nftAsset: "06fe1ba957728130154154d5e5b25a7b533ebe6c4516356c0aa69355757364632d757364742d76312e342d6c70",
        lpAsset: "8db03e0cc042a5f82434123a0509f590210996f1c7410c94f913ac48757364632d757364742d76312e342d6c70",
        assets: [
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed727455534443",
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed727455534454"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr_test1zqpmw0kkgm6fp9x0asq5vwuaccweeqdv3edhwckqr2gnvzurajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upq9z8vxj",
        poolAddress: "addr_test1zqh2uv0wvrtt579e92q35ktkzcj3lj3nzdm3xjpsdack3q5rajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqud27a8",
        nftAsset: "06fe1ba957728130154154d5e5b25a7b533ebe6c4516356c0aa69355646a65642d697573642d6461692d76312e342d6c70",
        lpAsset: "492fd7252d5914c9f5acb7eeb6b905b3a65b9a952c2300de34eb86c5646a65642d697573642d6461692d76312e342d6c70",
        assets: [
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed7274444a4544",
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed727469555344",
          "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed7274444149"
        ],
        multiples: [1n, 1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      }
    ],
    [NetworkId.MAINNET]: [
      {
        orderAddress: "addr1w9xy6edqv9hkptwzewns75ehq53nk8t73je7np5vmj3emps698n9g",
        poolAddress: "addr1wy7kkcpuf39tusnnyga5t2zcul65dwx9yqzg7sep3cjscesx2q5m5",
        nftAsset: "5d4b6afd3344adcf37ccef5558bb87f522874578c32f17160512e398444a45442d695553442d534c50",
        lpAsset: "2c07095028169d7ab4376611abef750623c8f955597a38cd15248640444a45442d695553442d534c50",
        assets: [
          "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1w93d8cuht3hvqt2qqfjqgyek3gk5d6ss2j93e5sh505m0ng8cmze2",
        poolAddress: "addr1wx8d45xlfrlxd7tctve8xgdtk59j849n00zz2pgyvv47t8sxa6t53",
        nftAsset: "d97fa91daaf63559a253970365fb219dc4364c028e5fe0606cdbfff9555344432d444a45442d534c50",
        lpAsset: "ac49e0969d76ed5aa9e9861a77be65f4fc29e9a979dc4c37a99eb8f4555344432d444a45442d534c50",
        assets: [
          "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443",
          "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344"
        ],
        multiples: [1n, 100n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1wxtv9k2lcum5pmcc4wu44a5tufulszahz84knff87wcawycez9lug",
        poolAddress: "addr1w9520fyp6g3pjwd0ymfy4v2xka54ek6ulv4h8vce54zfyfcm2m0sm",
        nftAsset: "96402c6f5e7a04f16b4d6f500ab039ff5eac5d0226d4f88bf5523ce85553444d2d695553442d534c50",
        lpAsset: "31f92531ac9f1af3079701fab7c66ce997eb07988277ee5b9d6403015553444d2d695553442d534c50",
        assets: [
          "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1wxr9ppdymqgw6g0hvaaa7wc6j0smwh730ujx6lczgdynehsguav8d",
        poolAddress: "addr1wxxdvtj6y4fut4tmu796qpvy2xujtd836yg69ahat3e6jjcelrf94",
        nftAsset: "07b0869ed7488657e24ac9b27b3f0fb4f76757f444197b2a38a15c3c444a45442d5553444d2d534c50",
        lpAsset: "5b042cf53c0b2ce4f30a9e743b4871ad8c6dcdf1d845133395f55a8e444a45442d5553444d2d534c50",
        assets: [
          "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344",
          "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1w9ksys0l07s9933kgkn4uxylsss5k6lqvt6e66kfc7am9sgtwqgv0",
        poolAddress: "addr1wx87yvnhj78yehh64unc7hr02dx73vmpedktz79xy2n3xxgs3t38l",
        nftAsset: "4e73e9cf8fd73e74956c67fa3a01486f02ab612ee580dc27755b8d57444a45442d4d795553442d534c50",
        lpAsset: "b69f5d48c91297142c46b764b69ab57844e3e7af9d7ba9bc63c3c517444a45442d4d795553442d534c50",
        assets: [
          "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344",
          "92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c4d79555344"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1w8akt26kwj9kc2y56p8x3s9e9lp2qqtcxql0rmnz55u6lks99kkjc",
        poolAddress: "addr1wxcsnc9wzuczcmcctzpl9c0w4r84f73rsmwl8ce8d9n54ygep9znj",
        nftAsset: "1d4c43ac86463f93c4cba60c28f143b2781d7f7328b18d8e68298e614d795553442d5553444d2d534c50",
        lpAsset: "5827249dcaf49ce7ccae2e0577fd9bf9514a4c34adabc7eb57e192594d795553442d5553444d2d534c50",
        assets: [
          "92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c4d79555344",
          "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d"
        ],
        multiples: [1n, 1n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1w86a53qhsmh0qszg486ell6nchy77yq6txksfz8p4z4r39cd4e04m",
        poolAddress: "addr1wytm0yuffszdzkme56mlm07htw388vkny2wy49ch7c3p57s4wwk57",
        nftAsset: "3ff28ad0d4788f24619746cc86b774495ed4727634b61710d2bb7ed5555344432d695553442d534c50",
        lpAsset: "40b6f8a17ba5d9bab02fc776c9677212b40bfc3df77346f0b1edcba6555344432d695553442d534c50",
        assets: [
          "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344"
        ],
        multiples: [1n, 100n],
        fee: 1000000n,
        adminFee: 5000000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1wy42rt3rdptdaa2lwlntkx49ksuqrmqqjlu7pf5l5f8upmgj3gq2m",
        poolAddress: "addr1wx4w03kq5tfhaad2fmglefgejj0anajcsvvg88w96lrmylc7mx5rm",
        nftAsset: "739150a2612da82e16adc2a3a1f88b256202d8415df0c5b7a2ff93fb555344432d695553442d302e312d534c50",
        lpAsset: "48bee898de501ff287165fdfc5be34818f3a41e474ae8f47f8c59f7a555344432d695553442d302e312d534c50",
        assets: [
          "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344"
        ],
        multiples: [1n, 100n],
        fee: 10000000n,
        adminFee: 500000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1w8cafpjmeer4j8t8aseqayhwkf4ezuufue0clvfthxecsacv83rt0",
        poolAddress: "addr1wywdvw0qwv2n97e8y5jsfqq3qryu6re3gxwqcc7fzscpwugxz5dwe",
        nftAsset: "a0d806e67be578911ca39260cff5eaa6eb06f9f4165ccd570282f5055553444d2d555344412d534c50",
        lpAsset: "5f0d38b3eb8fea72cd3cbdaa9594a74d0db79b5a27e85be5e9015bd65553444d2d555344412d534c50",
        assets: [
          "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d",
          "fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae45655534441"
        ],
        multiples: [1n, 1n],
        fee: 5000000n,
        adminFee: 500000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1w83fd654hwp5kzqkae4hqrasprq72tt4ppeghy20706jweqrcqkf3",
        poolAddress: "addr1wyge54qpez2zc250f8frwtksjzrg4l6n5cs34psqas9uz0syae9sf",
        nftAsset: "b7ff73b687f4abdec86ca9984faa70dfead433588f183c3f956fb213695553442d555344412d534c50",
        lpAsset: "5fd1180269cd5a01f397f37a17981424a3ec3bdab1e743a61f3bb113695553442d555344412d534c50",
        assets: [
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069555344",
          "fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae45655534441"
        ],
        multiples: [1n, 1n],
        fee: 10000000n,
        adminFee: 500000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1wykr5fpg2qjca5lt75qmh9g459vnwr08wj5xlfcwyleyqagryre2v",
        poolAddress: "addr1wxzuzc4279crnjeln9yae4lutkqsyz7trrwhvnfty8wa40q2zzcsm",
        nftAsset: "6d0af21948cca104be7e639ed7d9a169f15b7763c066df41ec4b29b8774554482d694554482d534c50",
        lpAsset: "b6b60bf469adb18c21ff3ad06bbdb9e78327b34d4c15db162de53b1c774554482d694554482d534c50",
        assets: [
          "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935455448",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069455448"
        ],
        multiples: [1n, 100n],
        fee: 10000000n,
        adminFee: 500000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1wx0mfd2vxe6x80fa50fw325n2ufnaaa53xkmrnuukt5d6uqyjjvj4",
        poolAddress: "addr1w90vp068jkxl5cx77w6wj6ufj5l628uec2y0eds5jhumn3chscq35",
        nftAsset: "6bdc0ad93ceb1f1df8f4be04d8037bc5d8dc21e5c8d654b48a9679f8774254432d694254432d534c50",
        lpAsset: "d4e0b170fc503735b260b1a0c99223c2b4e6dd6e87ccdcabfba28b8a774254432d694254432d534c50",
        assets: [
          "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935425443",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069425443"
        ],
        multiples: [1n, 100n],
        fee: 10000000n,
        adminFee: 500000000n,
        feeDenominator: 10000000000n
      },
      {
        orderAddress: "addr1wxaw7dge3st4v7jreug6t5zfhqlkvsjpkddxvm6e3rcgpysxvuf5z",
        poolAddress: "addr1wx302gec6k43m8cvvqa9rsr3dz40a0657hts3v4tuuvc33svhaqu9",
        nftAsset: "666c65d6d6152864ef16371beed29150259564bde5a30d345c5e236977534f4c2d69534f4c2d534c50",
        lpAsset: "d3facc199b218a60723500bb80fcfc091f5bd67bdb74df4c099d817477534f4c2d69534f4c2d534c50",
        assets: [
          "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935534f4c",
          "f66d78b4a3cb3d37afa0ec36461e51ecbde00f26c8f0a68f94b6988069534f4c"
        ],
        multiples: [1n, 100n],
        fee: 10000000n,
        adminFee: 500000000n,
        feeDenominator: 10000000000n
      }
    ]
  };
  StableswapConstant2.DEPLOYED_SCRIPTS = {
    [NetworkId.TESTNET]: {
      "06fe1ba957728130154154d5e5b25a7b533ebe6c4516356c0aa69355646a65642d697573642d76312e342d6c70": {
        order: {
          txHash: "527e421bc3eb8b9e5ec0a9ad214bb9b76148f57b9a5a8cbd83a51264f943e91d",
          outputIndex: 0
        },
        pool: {
          txHash: "527e421bc3eb8b9e5ec0a9ad214bb9b76148f57b9a5a8cbd83a51264f943e91d",
          outputIndex: 1
        },
        lp: {
          txHash: "527e421bc3eb8b9e5ec0a9ad214bb9b76148f57b9a5a8cbd83a51264f943e91d",
          outputIndex: 2
        },
        poolBatching: {
          txHash: "527e421bc3eb8b9e5ec0a9ad214bb9b76148f57b9a5a8cbd83a51264f943e91d",
          outputIndex: 3
        }
      },
      "06fe1ba957728130154154d5e5b25a7b533ebe6c4516356c0aa69355757364632d757364742d76312e342d6c70": {
        order: {
          txHash: "cf699550642c8ffc1673d1e5d56d8562ca7c7f5c0b513a8428c3f52cdcc8fdb7",
          outputIndex: 0
        },
        pool: {
          txHash: "cf699550642c8ffc1673d1e5d56d8562ca7c7f5c0b513a8428c3f52cdcc8fdb7",
          outputIndex: 1
        },
        lp: {
          txHash: "cf699550642c8ffc1673d1e5d56d8562ca7c7f5c0b513a8428c3f52cdcc8fdb7",
          outputIndex: 2
        },
        poolBatching: {
          txHash: "cf699550642c8ffc1673d1e5d56d8562ca7c7f5c0b513a8428c3f52cdcc8fdb7",
          outputIndex: 3
        }
      },
      "06fe1ba957728130154154d5e5b25a7b533ebe6c4516356c0aa69355646a65642d697573642d6461692d76312e342d6c70": {
        order: {
          txHash: "a8ab602259654697c85e2f61752d34cdb631f314eaeded0676fee6f6be70afe7",
          outputIndex: 0
        },
        pool: {
          txHash: "a8ab602259654697c85e2f61752d34cdb631f314eaeded0676fee6f6be70afe7",
          outputIndex: 1
        },
        lp: {
          txHash: "a8ab602259654697c85e2f61752d34cdb631f314eaeded0676fee6f6be70afe7",
          outputIndex: 2
        },
        poolBatching: {
          txHash: "a8ab602259654697c85e2f61752d34cdb631f314eaeded0676fee6f6be70afe7",
          outputIndex: 3
        }
      }
    },
    [NetworkId.MAINNET]: {
      "5d4b6afd3344adcf37ccef5558bb87f522874578c32f17160512e398444a45442d695553442d534c50": (
        // djed-iusd
        {
          order: {
            txHash: "20227174ec2f7853a71a02c435d063b3bf63851d4e0ad9a0c09250a087a6577e",
            outputIndex: 0
          },
          pool: {
            txHash: "20227174ec2f7853a71a02c435d063b3bf63851d4e0ad9a0c09250a087a6577e",
            outputIndex: 1
          },
          lp: {
            txHash: "20227174ec2f7853a71a02c435d063b3bf63851d4e0ad9a0c09250a087a6577e",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "20227174ec2f7853a71a02c435d063b3bf63851d4e0ad9a0c09250a087a6577e",
            outputIndex: 3
          }
        }
      ),
      "d97fa91daaf63559a253970365fb219dc4364c028e5fe0606cdbfff9555344432d444a45442d534c50": (
        // usdc-djed
        {
          order: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 0
          },
          pool: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 1
          },
          lp: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 3
          }
        }
      ),
      "96402c6f5e7a04f16b4d6f500ab039ff5eac5d0226d4f88bf5523ce85553444d2d695553442d534c50": (
        // usdm-iusd
        {
          order: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 0
          },
          pool: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 1
          },
          lp: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 3
          }
        }
      ),
      "07b0869ed7488657e24ac9b27b3f0fb4f76757f444197b2a38a15c3c444a45442d5553444d2d534c50": (
        // djed-usdm
        {
          order: {
            txHash: "dddccee9cd58cbf712f2ff2c49ea20537db681a333c701106aa13cd57aee3873",
            outputIndex: 0
          },
          pool: {
            txHash: "dddccee9cd58cbf712f2ff2c49ea20537db681a333c701106aa13cd57aee3873",
            outputIndex: 1
          },
          lp: {
            txHash: "dddccee9cd58cbf712f2ff2c49ea20537db681a333c701106aa13cd57aee3873",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "dddccee9cd58cbf712f2ff2c49ea20537db681a333c701106aa13cd57aee3873",
            outputIndex: 3
          }
        }
      ),
      "4e73e9cf8fd73e74956c67fa3a01486f02ab612ee580dc27755b8d57444a45442d4d795553442d534c50": (
        // djed-myusd
        {
          order: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 0
          },
          pool: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 1
          },
          lp: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "8b880e77a726e76e5dd585cda2c4c2ac93f1cfccc06910f00550fb820ae1fc54",
            outputIndex: 3
          }
        }
      ),
      "1d4c43ac86463f93c4cba60c28f143b2781d7f7328b18d8e68298e614d795553442d5553444d2d534c50": (
        // myusd-usdm
        {
          order: {
            txHash: "316e7a87af964d9a65b2eecdb4afd62eae639b37539f0102f1b90144966bb074",
            outputIndex: 0
          },
          pool: {
            txHash: "316e7a87af964d9a65b2eecdb4afd62eae639b37539f0102f1b90144966bb074",
            outputIndex: 1
          },
          lp: {
            txHash: "316e7a87af964d9a65b2eecdb4afd62eae639b37539f0102f1b90144966bb074",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "316e7a87af964d9a65b2eecdb4afd62eae639b37539f0102f1b90144966bb074",
            outputIndex: 3
          }
        }
      ),
      "3ff28ad0d4788f24619746cc86b774495ed4727634b61710d2bb7ed5555344432d695553442d534c50": (
        // usdc-iusd
        {
          order: {
            txHash: "20c0cab94e5fcb31c9d91206fa2da754f484bb006f5d581c4afd39d83003ac80",
            outputIndex: 0
          },
          pool: {
            txHash: "20c0cab94e5fcb31c9d91206fa2da754f484bb006f5d581c4afd39d83003ac80",
            outputIndex: 1
          },
          lp: {
            txHash: "20c0cab94e5fcb31c9d91206fa2da754f484bb006f5d581c4afd39d83003ac80",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "20c0cab94e5fcb31c9d91206fa2da754f484bb006f5d581c4afd39d83003ac80",
            outputIndex: 3
          }
        }
      ),
      "739150a2612da82e16adc2a3a1f88b256202d8415df0c5b7a2ff93fb555344432d695553442d302e312d534c50": (
        // usdc-iusd-0.1
        {
          order: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 0
          },
          pool: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 1
          },
          lp: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "48019a931af442e1eedab6c5b52b3069cf6eadb2483a2131f517e62fddfd5662",
            outputIndex: 3
          }
        }
      ),
      "a0d806e67be578911ca39260cff5eaa6eb06f9f4165ccd570282f5055553444d2d555344412d534c50": (
        // usdm-usda
        {
          order: {
            txHash: "0420f0b0a47d68e1ff5eb263d12b32480084de2429ca81cf557bafd374ca49ec",
            outputIndex: 0
          },
          pool: {
            txHash: "0420f0b0a47d68e1ff5eb263d12b32480084de2429ca81cf557bafd374ca49ec",
            outputIndex: 1
          },
          lp: {
            txHash: "0420f0b0a47d68e1ff5eb263d12b32480084de2429ca81cf557bafd374ca49ec",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "0420f0b0a47d68e1ff5eb263d12b32480084de2429ca81cf557bafd374ca49ec",
            outputIndex: 3
          }
        }
      ),
      "b7ff73b687f4abdec86ca9984faa70dfead433588f183c3f956fb213695553442d555344412d534c50": (
        // iusd-usda
        {
          order: {
            txHash: "438e0d29b9cb4bd862afb91d7f492b32af6f7bbeebbbb12fdc8ed43c1135430a",
            outputIndex: 0
          },
          pool: {
            txHash: "438e0d29b9cb4bd862afb91d7f492b32af6f7bbeebbbb12fdc8ed43c1135430a",
            outputIndex: 1
          },
          lp: {
            txHash: "438e0d29b9cb4bd862afb91d7f492b32af6f7bbeebbbb12fdc8ed43c1135430a",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "438e0d29b9cb4bd862afb91d7f492b32af6f7bbeebbbb12fdc8ed43c1135430a",
            outputIndex: 3
          }
        }
      ),
      "6d0af21948cca104be7e639ed7d9a169f15b7763c066df41ec4b29b8774554482d694554482d534c50": (
        // weth-ieth
        {
          order: {
            txHash: "cd7a90a75531e1be780c1672bca8823175d6cf1c7c3d362bf4524ce96b45b7dd",
            outputIndex: 0
          },
          pool: {
            txHash: "cd7a90a75531e1be780c1672bca8823175d6cf1c7c3d362bf4524ce96b45b7dd",
            outputIndex: 1
          },
          lp: {
            txHash: "cd7a90a75531e1be780c1672bca8823175d6cf1c7c3d362bf4524ce96b45b7dd",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "cd7a90a75531e1be780c1672bca8823175d6cf1c7c3d362bf4524ce96b45b7dd",
            outputIndex: 3
          }
        }
      ),
      "6bdc0ad93ceb1f1df8f4be04d8037bc5d8dc21e5c8d654b48a9679f8774254432d694254432d534c50": (
        // wbtc-ibtc
        {
          order: {
            txHash: "f6923f13cbb7c8068ee890815ccd04f0c5fc4dc63900c5ddc481ce14a8789755",
            outputIndex: 0
          },
          pool: {
            txHash: "f6923f13cbb7c8068ee890815ccd04f0c5fc4dc63900c5ddc481ce14a8789755",
            outputIndex: 1
          },
          lp: {
            txHash: "f6923f13cbb7c8068ee890815ccd04f0c5fc4dc63900c5ddc481ce14a8789755",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "f6923f13cbb7c8068ee890815ccd04f0c5fc4dc63900c5ddc481ce14a8789755",
            outputIndex: 3
          }
        }
      ),
      "666c65d6d6152864ef16371beed29150259564bde5a30d345c5e236977534f4c2d69534f4c2d534c50": (
        // wsol-isol
        {
          order: {
            txHash: "3d0da995e695d9aba6babcad2c0d6e2fac2aa65eddbe65ca3bddf2f2618a19cb",
            outputIndex: 0
          },
          pool: {
            txHash: "3d0da995e695d9aba6babcad2c0d6e2fac2aa65eddbe65ca3bddf2f2618a19cb",
            outputIndex: 1
          },
          lp: {
            txHash: "3d0da995e695d9aba6babcad2c0d6e2fac2aa65eddbe65ca3bddf2f2618a19cb",
            outputIndex: 2
          },
          poolBatching: {
            txHash: "3d0da995e695d9aba6babcad2c0d6e2fac2aa65eddbe65ca3bddf2f2618a19cb",
            outputIndex: 3
          }
        }
      )
    }
  };
  function getConfigByLpAsset(lpAsset, networkId) {
    const config = StableswapConstant2.CONFIG[networkId].find(
      (config2) => config2.lpAsset === Asset.toString(lpAsset)
    );
    invariant(config, `Invalid Stableswap LP Asset ${Asset.toString(lpAsset)}`);
    return config;
  }
  StableswapConstant2.getConfigByLpAsset = getConfigByLpAsset;
  function getConfigFromStableswapOrderAddress(address, networkId) {
    const config = StableswapConstant2.CONFIG[networkId].find((config2) => {
      return address === config2.orderAddress;
    });
    invariant(config, `Invalid Stableswap Order Address: ${address}`);
    return config;
  }
  StableswapConstant2.getConfigFromStableswapOrderAddress = getConfigFromStableswapOrderAddress;
  function getStableswapReferencesScript(nftAsset, networkId) {
    const refScript = StableswapConstant2.DEPLOYED_SCRIPTS[networkId][Asset.toString(nftAsset)];
    invariant(
      refScript,
      `Invalid Stableswap Nft Asset ${Asset.toString(nftAsset)}`
    );
    return refScript;
  }
  StableswapConstant2.getStableswapReferencesScript = getStableswapReferencesScript;
})(StableswapConstant || (StableswapConstant = {}));
var DexV2Constant;
((DexV2Constant2) => {
  DexV2Constant2.DEFAULT_CANCEL_TIPS = 300000n;
  DexV2Constant2.MIN_TRADING_FEE = 5n;
  DexV2Constant2.MAX_TRADING_FEE = 2000n;
  DexV2Constant2.CONFIG = {
    [NetworkId.TESTNET]: {
      factoryAsset: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b4d5346",
      poolAuthenAsset: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b4d5350",
      globalSettingAsset: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b4d534753",
      lpPolicyId: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b",
      globalSettingScriptHash: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b",
      globalSettingScriptHashBech32: "script1664wypvm4msc3a6fzayneamr0enee5sehham7nwtavwsk2s2vg9",
      orderScriptHash: "da9525463841173ad1230b1d5a1b5d0a3116bbdeb4412327148a1b7a",
      orderScriptHashBech32: "script1m22j233cgytn45frpvw45x6apgc3dw77k3qjxfc53gdh5cejhly",
      poolScriptHash: "d6ba9b7509eac866288ff5072d2a18205ac56f744bc82dcd808cb8fe",
      poolScriptHashBech32: "script166afkagfatyxv2y075rj62scypdv2mm5f0yzmnvq3ju0uqqmszv",
      poolCreationAddress: "addr_test1zrtt4xm4p84vse3g3l6swtf2rqs943t0w39ustwdszxt3l5rajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqhns793",
      factoryScriptHash: "6e23fe172b5b50e2ad59aded9ee8d488f74c7f4686f91b032220adad",
      factoryScriptHashBech32: "script1dc3lu9ettdgw9t2e4hkea6x53rm5cl6xsmu3kqezyzk66vpljxc",
      factoryAddress: "addr_test1zphz8lsh9dd4pc4dtxk7m8hg6jy0wnrlg6r0jxcrygs2mtvrajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqjgg24z",
      expiredOrderCancelAddress: "stake_test17rytpnrpxax5p8leepgjx9cq8ecedgly6jz4xwvvv4kvzfqz6sgpf",
      poolBatchingAddress: "stake_test17rann6nth9675m0y5tz32u3rfhzcfjymanxqnfyexsufu5glcajhf",
      orderEnterpriseAddress: "addr_test1wrdf2f2x8pq3wwk3yv936ksmt59rz94mm66yzge8zj9pk7s0kjph3"
    },
    [NetworkId.MAINNET]: {
      factoryAsset: "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c4d5346",
      poolAuthenAsset: "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c4d5350",
      globalSettingAsset: "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c4d534753",
      lpPolicyId: "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c",
      globalSettingScriptHash: "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c",
      globalSettingScriptHashBech32: "script17kqgctyepkrd549le97cnnhxa73qekzxzctrt9rcm945c880puk",
      orderScriptHash: "c3e28c36c3447315ba5a56f33da6a6ddc1770a876a8d9f0cb3a97c4c",
      orderScriptHashBech32: "script1c03gcdkrg3e3twj62menmf4xmhqhwz58d2xe7r9n497yc6r9qhd",
      poolScriptHash: "ea07b733d932129c378af627436e7cbc2ef0bf96e0036bb51b3bde6b",
      poolScriptHashBech32: "script1agrmwv7exgffcdu27cn5xmnuhsh0p0ukuqpkhdgm800xksw7e2w",
      poolCreationAddress: "addr1z84q0denmyep98ph3tmzwsmw0j7zau9ljmsqx6a4rvaau66j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq777e2a",
      factoryScriptHash: "7bc5fbd41a95f561be84369631e0e35895efb0b73e0a7480bb9ed730",
      factoryScriptHashBech32: "script100zlh4q6jh6kr05yx6trrc8rtz27lv9h8c98fq9mnmtnqfa47eg",
      factoryAddress: "addr1z9aut775r22l2cd7ssmfvv0qudvftmaskulq5ayqhw0dwvzj2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pqgjw6pl",
      expiredOrderCancelAddress: "stake178ytpnrpxax5p8leepgjx9cq8ecedgly6jz4xwvvv4kvzfq9s6295",
      poolBatchingAddress: "stake17y02a946720zw6pw50upt2arvxsvvpvaghjtl054h0f0gjsfyjz59",
      orderEnterpriseAddress: "addr1w8p79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqst2ctf"
    }
  };
  DexV2Constant2.DEPLOYED_SCRIPTS = {
    [NetworkId.TESTNET]: {
      order: {
        txHash: "8c98f0530cba144d264fbd2731488af25257d7ce6a0cd1586fc7209363724f03",
        outputIndex: 0
      },
      pool: {
        txHash: "9f30b1c3948a009ceebda32d0b1d25699674b2eaf8b91ef029a43bfc1073ce28",
        outputIndex: 0
      },
      factory: {
        txHash: "9741d59656e9ad54f197b0763482eede9a6fa1616c4547797eee6617f92a1396",
        outputIndex: 0
      },
      authen: {
        txHash: "c429b8ee27e5761ba8714e26e3a5899886cd28d136d43e969d4bc1acf0f72d4a",
        outputIndex: 0
      },
      poolBatching: {
        txHash: "b0a6c5512735c7a183a167eed035ac75c191d6ff5be9736dfa1f1f02f7ae5dbc",
        outputIndex: 0
      },
      expiredOrderCancellation: {
        txHash: "ee718dd86e3cb89e802aa8b2be252fccf6f15263f4a26b5f478c5135c40264c6",
        outputIndex: 0
      }
    },
    [NetworkId.MAINNET]: {
      order: {
        txHash: "cf4ecddde0d81f9ce8fcc881a85eb1f8ccdaf6807f03fea4cd02da896a621776",
        outputIndex: 0
      },
      pool: {
        txHash: "2536194d2a976370a932174c10975493ab58fd7c16395d50e62b7c0e1949baea",
        outputIndex: 0
      },
      factory: {
        txHash: "59c7fa5c30cbab4e6d38f65e15d1adef71495321365588506ad089d237b602e0",
        outputIndex: 0
      },
      authen: {
        txHash: "dbc1498500a6e79baa0f34d10de55cdb4289ca6c722bd70e1e1b78a858f136b9",
        outputIndex: 0
      },
      poolBatching: {
        txHash: "d46bd227bd2cf93dedd22ae9b6d92d30140cf0d68b756f6608e38d680c61ad17",
        outputIndex: 0
      },
      expiredOrderCancellation: {
        txHash: "ef3acc7dfc5a98bffe8f4d4400e65a9ade5a1316b2fcb7145c3b83dba38a66f5",
        outputIndex: 0
      }
    }
  };
})(DexV2Constant || (DexV2Constant = {}));
var LbeV2Constant;
((LbeV2Constant2) => {
  LbeV2Constant2.FACTORY_AUTH_AN = "666163746f7279";
  LbeV2Constant2.TREASURY_AUTH_AN = "7472656173757279";
  LbeV2Constant2.MANAGER_AUTH_AN = "4d616e61676572";
  LbeV2Constant2.SELLER_AUTH_AN = "73656c6c6572";
  LbeV2Constant2.ORDER_AUTH_AN = "6f72646572";
  LbeV2Constant2.ORDER_COMMISSION = 250000n;
  LbeV2Constant2.COLLECT_SELLER_COMMISSION = 250000n;
  LbeV2Constant2.SELLER_COMMISSION = 1500000n;
  LbeV2Constant2.CREATE_POOL_COMMISSION = 10000000n;
  LbeV2Constant2.TREASURY_MIN_ADA = 5000000n;
  LbeV2Constant2.MANAGER_MIN_ADA = 2500000n;
  LbeV2Constant2.SELLER_MIN_ADA = 2500000n;
  LbeV2Constant2.ORDER_MIN_ADA = 2500000n;
  LbeV2Constant2.MIN_POOL_ALLOCATION_POINT = 70n;
  LbeV2Constant2.MAX_POOL_ALLOCATION_POINT = 100n;
  LbeV2Constant2.MAX_PENALTY_RATE = 25n;
  LbeV2Constant2.MINIMUM_SELLER_COLLECTED = 20;
  LbeV2Constant2.MINIMUM_ORDER_COLLECTED = 30;
  LbeV2Constant2.MINIMUM_ORDER_REDEEMED = 30;
  LbeV2Constant2.MAX_DISCOVERY_RANGE = 2592000000n;
  LbeV2Constant2.MAX_PENALTY_RANGE = 172800000n;
  LbeV2Constant2.DEFAULT_SELLER_COUNT = 20n;
  const TESTNET_FACTORY_HASH = "7f2f769a9260eb698232022af03fba12ef0a29f94fc93c4fd2624972";
  const MAINNET_FACTORY_HASH = "dea947ac55fb4c2c38bb11341f2b82b2d62e1a120330f82dc1e56ead";
  LbeV2Constant2.CONFIG = {
    [NetworkId.TESTNET]: {
      factoryAsset: TESTNET_FACTORY_HASH + LbeV2Constant2.FACTORY_AUTH_AN,
      factoryHash: TESTNET_FACTORY_HASH,
      factoryHashBech32: "script10uhhdx5jvr4knq3jqg40q0a6zths520eflyncn7jvfyhyqahrl3",
      factoryAddress: "addr_test1wplj7a56jfswk6vzxgpz4uplhgfw7z3fl98uj0z06f3yjusz7ufvk",
      factoryRewardAddress: "stake_test17plj7a56jfswk6vzxgpz4uplhgfw7z3fl98uj0z06f3yjuszkz3mu",
      treasuryAsset: TESTNET_FACTORY_HASH + LbeV2Constant2.TREASURY_AUTH_AN,
      treasuryHash: "f0dbf7cdc1042f403cad57cff6f602b2e657f8f557b8cf8c23482954",
      treasuryHashBech32: "script17rdl0nwpqsh5q09d2l8ldaszktn9078427uvlrprfq54gr7nrx6",
      treasuryAddress: "addr_test1wrcdha7dcyzz7spu44tulahkq2ewv4lc74tm3nuvydyzj4qx8r0da",
      managerAsset: TESTNET_FACTORY_HASH + LbeV2Constant2.MANAGER_AUTH_AN,
      managerHash: "46246888d57347a8ad2705843e9131f03e55701571896ed571f90e3a",
      managerHashBech32: "script1gcjx3zx4wdr63tf8qkzrayf37ql92uq4wxyka4t3ly8r5kjsrlk",
      managerAddress: "addr_test1wprzg6yg64e5029dyuzcg053x8cru4tsz4ccjmk4w8usuwsp4y75x",
      sellerAsset: TESTNET_FACTORY_HASH + LbeV2Constant2.SELLER_AUTH_AN,
      sellerHash: "f6ba0fa37ce6aaaf8da7b0ee4192361fd443a8d3d70fb275986a2fce",
      sellerHashBech32: "script176aqlgmuu642lrd8krhyry3krl2y82xn6u8myavcdghuukmdwrq",
      sellerAddress: "addr_test1wrmt5rar0nn24tud57cwusvjxc0agsag60tslvn4np4zlnszyuccc",
      orderAsset: TESTNET_FACTORY_HASH + LbeV2Constant2.ORDER_AUTH_AN,
      orderHash: "28ead81adf8154687e0d1d09d14375f6be0626107545a59d7d5e311a",
      orderHashBech32: "script19r4dsxkls92xslsdr5yazsm476lqvfssw4z6t8tatcc350sd37w",
      orderAddress: "addr_test1zq5w4kq6m7q4g6r7p5wsn52rwhmtup3xzp65tfva040rzx5rajt8r8wqtygrfduwgukk73m5gcnplmztc5tl5ngy0upqqym3e9"
    },
    [NetworkId.MAINNET]: {
      factoryAsset: MAINNET_FACTORY_HASH + LbeV2Constant2.FACTORY_AUTH_AN,
      factoryHash: MAINNET_FACTORY_HASH,
      factoryHashBech32: "script1m6550tz4ldxzcw9mzy6p72uzkttzuxsjqvc0stwpu4h26pl45ch",
      factoryAddress: "addr1w802j3av2ha5ctpchvgng8ets2edvts6zgpnp7pdc8jkatgwxaxhw",
      factoryRewardAddress: "stake17802j3av2ha5ctpchvgng8ets2edvts6zgpnp7pdc8jkatgjvaqtu",
      treasuryAsset: MAINNET_FACTORY_HASH + LbeV2Constant2.TREASURY_AUTH_AN,
      treasuryHash: "1ce6abbd967cab867ad73855f8b154fcc57e41b15605b91590451650",
      treasuryHashBech32: "script1rnn2h0vk0j4cv7kh8p2l3v25lnzhusd32czmj9vsg5t9q69xnhh",
      treasuryAddress: "addr1wywwd2aaje72hpn66uu9t7932n7v2ljpk9tqtwg4jpz3v5qpqs70n",
      managerAsset: MAINNET_FACTORY_HASH + LbeV2Constant2.MANAGER_AUTH_AN,
      managerHash: "e951d381ef510ae02b7496c2ff039e640ab2e2a561423d0cbf34b032",
      managerHashBech32: "script1a9ga8q002y9wq2m5jmp07qu7vs9t9c49v9pr6r9lxjcry2xehgl",
      managerAddress: "addr1w854r5upaags4cptwjtv9lcrnejq4vhz54s5y0gvhu6tqvsccjry6",
      sellerAsset: MAINNET_FACTORY_HASH + LbeV2Constant2.SELLER_AUTH_AN,
      sellerHash: "ecf97d6f0ace26e69fa428610c7dbf5a686e1197f76511449d9a1b64",
      sellerHashBech32: "script1anuh6mc2ecnwd8ay9psscldltf5xuyvh7aj3z3yangdkgh7ds8d",
      sellerAddress: "addr1w8k0jlt0pt8zde5l5s5xzrrahadxsms3jlmk2y2ynkdpkeqn95g7r",
      orderAsset: MAINNET_FACTORY_HASH + LbeV2Constant2.ORDER_AUTH_AN,
      orderHash: "5176775eed690d088bd29d9a6934b1e35ef1d897deb61d7b5dde11ca",
      orderHashBech32: "script129m8whhddyxs3z7jnkdxjd93ud00rkyhm6mp676amcgu5kg5c44",
      orderAddress: "addr1z9ghva67a45s6zyt62we56f5k834auwcjl0tv8tmth0prjjj2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pqsk3urw"
    }
  };
  LbeV2Constant2.DEPLOYED_SCRIPTS = {
    [NetworkId.TESTNET]: {
      factory: {
        txHash: "834e0958594e51c525363bbdabd0cdbe773a358ac2e2c8321cc3f645b30335ae",
        outputIndex: 0
      },
      treasury: {
        txHash: "a5b0274543fbad4ca79798be047317a0b4b270ab6011dd7e08fc663ba6ee1f32",
        outputIndex: 0
      },
      manager: {
        txHash: "f0c8a033bf84faad54e70c9882057a422fa1ee257843fad0a07aa5eb7ee9ebaf",
        outputIndex: 0
      },
      seller: {
        txHash: "a15c06f2fa3e91359136b346eae43997311644320e18a0c5f2ea40c8127c9284",
        outputIndex: 0
      },
      order: {
        txHash: "a08042f93335157e6dd8e87feef448d5e9000f60ef14cbe19ae365c8de9bead8",
        outputIndex: 0
      }
    },
    [NetworkId.MAINNET]: {
      factory: {
        txHash: "6b9976bb251ad15a21480bd37ea45343cff6fdd713744c1948ce674a8c4f510f",
        outputIndex: 0
      },
      treasury: {
        txHash: "bf343adb586dab792665d23a1c1fa8727d2014e58630d007598296586782018d",
        outputIndex: 0
      },
      manager: {
        txHash: "e8fb105295f8871670676fe2162f6a301c8413f8273a23cd1fde7c5f960db0af",
        outputIndex: 0
      },
      seller: {
        txHash: "590ece2aa32fdc11c27a99ffe50392f8329e1645e9c3249cf0e3c3cd77cfa4e3",
        outputIndex: 0
      },
      order: {
        txHash: "314cfc020092185a666cfc9d8d747dd0760358bc1cf06385343b97041b3c90ed",
        outputIndex: 0
      }
    }
  };
})(LbeV2Constant || (LbeV2Constant = {}));
var MetadataMessage = /* @__PURE__ */ ((MetadataMessage2) => {
  MetadataMessage2["DEPOSIT_ORDER"] = "SDK Minswap: Deposit Order";
  MetadataMessage2["CANCEL_ORDER"] = "SDK Minswap: Cancel Order";
  MetadataMessage2["CANCEL_ORDERS_AUTOMATICALLY"] = "SDK Minswap: Cancel Orders Automatically";
  MetadataMessage2["ZAP_IN_ORDER"] = "SDK Minswap: Zap Order";
  MetadataMessage2["ZAP_OUT_ORDER"] = "SDK Minswap: Zap Out Order";
  MetadataMessage2["SWAP_EXACT_IN_ORDER"] = "SDK Minswap: Swap Exact In Order";
  MetadataMessage2["SWAP_EXACT_IN_LIMIT_ORDER"] = "SDK Minswap: Swap Exact In Limit Order";
  MetadataMessage2["SWAP_EXACT_OUT_ORDER"] = "SDK Minswap: Swap Exact Out Order";
  MetadataMessage2["WITHDRAW_ORDER"] = "SDK Minswap: Withdraw Order";
  MetadataMessage2["STOP_ORDER"] = "SDK Minswap: Stop Order";
  MetadataMessage2["OCO_ORDER"] = "SDK Minswap: OCO Order";
  MetadataMessage2["ROUTING_ORDER"] = "SDK Minswap: Routing Order";
  MetadataMessage2["PARTIAL_SWAP_ORDER"] = "SDK Minswap: Partial Fill Order";
  MetadataMessage2["DONATION_ORDER"] = "SDK Minswap: Donation Order";
  MetadataMessage2["MIXED_ORDERS"] = "SDK Minswap: Mixed Orders";
  MetadataMessage2["CREATE_POOL"] = "SDK Minswap: Create Pool";
  MetadataMessage2["CREATE_EVENT"] = "SDK Minswap: Create Event";
  MetadataMessage2["UPDATE_EVENT"] = "SDK Minswap: Update Event";
  MetadataMessage2["CANCEL_EVENT_BY_OWNER"] = "SDK Minswap: Cancel Event By Onwer";
  MetadataMessage2["CANCEL_EVENT_BY_WORKER"] = "SDK Minswap: Cancel Event By Worker";
  MetadataMessage2["LBE_V2_DEPOSIT_ORDER_EVENT"] = "SDK Minswap: Deposit Lbe V2 Order";
  MetadataMessage2["LBE_V2_WITHDRAW_ORDER_EVENT"] = "SDK Minswap: Withdraw Lbe V2 Order";
  MetadataMessage2["CLOSE_EVENT"] = "SDK Minswap: Close Event";
  MetadataMessage2["LBE_V2_ADD_SELLERS"] = "SDK Minswap: Lbe V2 add more sellers";
  MetadataMessage2["LBE_V2_COUNTING_SELLERS"] = "SDK Minswap: Lbe V2 counting sellers";
  MetadataMessage2["LBE_V2_COLLECT_MANAGER"] = "SDK Minswap: Lbe V2 collect manager";
  MetadataMessage2["LBE_V2_COLLECT_ORDER"] = "SDK Minswap: Lbe V2 collect order";
  MetadataMessage2["LBE_V2_REDEEM_LP"] = "SDK Minswap: Lbe V2 redeem lp";
  MetadataMessage2["LBE_V2_REFUND"] = "SDK Minswap: Lbe V2 refund";
  MetadataMessage2["LBE_V2_CREATE_AMM_POOL"] = "SDK Minswap: Lbe V2 create AMM pool";
  MetadataMessage2["DAO_POOL_FEE_UPDATE"] = "Minswap: Request of Pool Fee Manager";
  return MetadataMessage2;
})(MetadataMessage || {});
const FIXED_DEPOSIT_ADA = 2000000n;
const SECURITY_PARAM = {
  [NetworkEnvironment.MAINNET]: 2160,
  [NetworkEnvironment.TESTNET_PREPROD]: 2160,
  [NetworkEnvironment.TESTNET_PREVIEW]: 2160
};

function getScriptHashFromAddress(addr) {
  try {
    const addrDetail = Addresses.inspect(addr);
    const scriptHash = addrDetail.payment?.hash;
    if (!scriptHash) {
      return null;
    }
    return Utils.encodeBech32("script", scriptHash);
  } catch {
    return null;
  }
}

function normalizeAssets(a, b) {
  if (a === "lovelace") {
    return [a, b];
  }
  if (b === "lovelace") {
    return [b, a];
  }
  if (a < b) {
    return [a, b];
  } else {
    return [b, a];
  }
}
var PoolFeeSharing;
((PoolFeeSharing2) => {
  function toPlutusData(feeSharing) {
    const { feeTo, feeToDatumHash } = feeSharing;
    return new Constr(0, [
      AddressPlutusData.toPlutusData(feeTo),
      feeToDatumHash ? new Constr(0, [feeToDatumHash]) : new Constr(1, [])
    ]);
  }
  PoolFeeSharing2.toPlutusData = toPlutusData;
  function fromPlutusData(networkId, data) {
    if (data.index !== 0) {
      throw new Error(
        `Index of Pool Profit Sharing must be 0, actual: ${data.index}`
      );
    }
    let feeToDatumHash = void 0;
    const maybeFeeToDatumHash = data.fields[1];
    switch (maybeFeeToDatumHash.index) {
      case 0: {
        feeToDatumHash = maybeFeeToDatumHash.fields[0];
        break;
      }
      case 1: {
        feeToDatumHash = void 0;
        break;
      }
      default: {
        throw new Error(
          `Index of Fee To DatumHash must be 0 or 1, actual: ${maybeFeeToDatumHash.index}`
        );
      }
    }
    return {
      feeTo: AddressPlutusData.fromPlutusData(
        networkId,
        data.fields[0]
      ),
      feeToDatumHash
    };
  }
  PoolFeeSharing2.fromPlutusData = fromPlutusData;
})(PoolFeeSharing || (PoolFeeSharing = {}));
function checkValidPoolOutput(poolAddress, value, datumHash) {
  invariant(
    getScriptHashFromAddress(poolAddress) === DexV1Constant.POOL_SCRIPT_HASH,
    `invalid pool address: ${poolAddress}`
  );
  if (value.find(
    ({ unit }) => unit === `${DexV1Constant.FACTORY_POLICY_ID}${DexV1Constant.FACTORY_ASSET_NAME}`
  )?.quantity !== "1") {
    throw new Error(`expect pool to have 1 factory token`);
  }
  invariant(datumHash, `expect pool to have datum hash, got ${datumHash}`);
}
function isValidPoolOutput(poolAddress, value, datumHash) {
  try {
    checkValidPoolOutput(poolAddress, value, datumHash);
    return true;
  } catch {
    return false;
  }
}

var __defProp$c = Object.defineProperty;
var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$c = (obj, key, value) => __defNormalProp$c(obj, typeof key !== "symbol" ? key + "" : key, value);
const DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR = 10000n;
const MIN_POOL_V2_TRADING_FEE_NUMERATOR = 5n;
const MAX_POOL_V2_TRADING_FEE_NUMERATOR = 2000n;
var PoolV1;
((PoolV12) => {
  class State {
    constructor(address, txIn, value, datumHash) {
      /** The transaction hash and output index of the pool UTxO */
      __publicField$c(this, "address");
      __publicField$c(this, "txIn");
      __publicField$c(this, "value");
      __publicField$c(this, "datumHash");
      __publicField$c(this, "assetA");
      __publicField$c(this, "assetB");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumHash = datumHash;
      const nft = value.find(
        ({ unit }) => unit.startsWith(DexV1Constant.POOL_NFT_POLICY_ID)
      );
      invariant(nft, "pool doesn't have NFT");
      const poolId = nft.unit.slice(56);
      const relevantAssets = value.filter(
        ({ unit }) => !unit.startsWith(DexV1Constant.FACTORY_POLICY_ID) && // factory token
        !unit.endsWith(poolId)
        // NFT and LP tokens from profit sharing
      );
      switch (relevantAssets.length) {
        case 2: {
          this.assetA = "lovelace";
          const nonADAAssets = relevantAssets.filter(
            ({ unit }) => unit !== "lovelace"
          );
          invariant(
            nonADAAssets.length === 1,
            "pool must have 1 non-ADA asset"
          );
          this.assetB = nonADAAssets[0].unit;
          break;
        }
        case 3: {
          const nonADAAssets = relevantAssets.filter(
            ({ unit }) => unit !== "lovelace"
          );
          invariant(
            nonADAAssets.length === 2,
            "pool must have 1 non-ADA asset"
          );
          [this.assetA, this.assetB] = normalizeAssets(
            nonADAAssets[0].unit,
            nonADAAssets[1].unit
          );
          break;
        }
        default:
          throw new Error(
            "pool must have 2 or 3 assets except factory, NFT and LP tokens"
          );
      }
    }
    get nft() {
      const nft = this.value.find(
        ({ unit }) => unit.startsWith(DexV1Constant.POOL_NFT_POLICY_ID)
      );
      invariant(nft, "pool doesn't have NFT");
      return nft.unit;
    }
    get id() {
      return this.nft.slice(DexV1Constant.POOL_NFT_POLICY_ID.length);
    }
    get assetLP() {
      return `${DexV1Constant.LP_POLICY_ID}${this.id}`;
    }
    get reserveA() {
      return BigInt(
        this.value.find(({ unit }) => unit === this.assetA)?.quantity ?? "0"
      );
    }
    get reserveB() {
      return BigInt(
        this.value.find(({ unit }) => unit === this.assetB)?.quantity ?? "0"
      );
    }
  }
  PoolV12.State = State;
  ((Datum2) => {
    function toPlutusData(datum) {
      const { assetA, assetB, totalLiquidity, rootKLast, feeSharing } = datum;
      return new Constr(0, [
        Asset.toPlutusData(assetA),
        Asset.toPlutusData(assetB),
        totalLiquidity,
        rootKLast,
        feeSharing ? new Constr(0, [PoolFeeSharing.toPlutusData(feeSharing)]) : new Constr(1, [])
      ]);
    }
    Datum2.toPlutusData = toPlutusData;
    function fromPlutusData(networkId, data) {
      if (data.index !== 0) {
        throw new Error(`Index of Pool Datum must be 0, actual: ${data.index}`);
      }
      let feeSharing = void 0;
      const maybeFeeSharingConstr = data.fields[4];
      switch (maybeFeeSharingConstr.index) {
        case 0: {
          feeSharing = PoolFeeSharing.fromPlutusData(
            networkId,
            maybeFeeSharingConstr.fields[0]
          );
          break;
        }
        case 1: {
          feeSharing = void 0;
          break;
        }
        default: {
          throw new Error(
            `Index of Pool Fee Sharing must be 0 or 1, actual: ${maybeFeeSharingConstr.index}`
          );
        }
      }
      return {
        assetA: Asset.fromPlutusData(data.fields[0]),
        assetB: Asset.fromPlutusData(data.fields[1]),
        totalLiquidity: data.fields[2],
        rootKLast: data.fields[3],
        feeSharing
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
  })(PoolV12.Datum || (PoolV12.Datum = {}));
})(PoolV1 || (PoolV1 = {}));
var StablePool;
((StablePool2) => {
  class State {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$c(this, "address");
      __publicField$c(this, "txIn");
      __publicField$c(this, "value");
      __publicField$c(this, "datumCbor");
      __publicField$c(this, "datum");
      __publicField$c(this, "config");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = Datum.fromPlutusData(DataObject.from(datum));
      const allConfigs = StableswapConstant.CONFIG[networkId];
      const config = allConfigs.find((cfg) => cfg.poolAddress === address);
      if (!config) {
        throw new Error("Invalid Stable Pool address");
      }
      this.config = config;
      if (!value.find((v) => v.unit === config.nftAsset && v.quantity === "1")) {
        throw new Error("Cannot find the Pool NFT in the value");
      }
    }
    get assets() {
      return this.config.assets;
    }
    get nft() {
      return this.config.nftAsset;
    }
    get lpAsset() {
      return this.config.lpAsset;
    }
    get reserves() {
      return this.datum.balances;
    }
    get totalLiquidity() {
      return this.datum.totalLiquidity;
    }
    get orderHash() {
      return this.datum.orderHash;
    }
    get amp() {
      return this.datum.amplificationCoefficient;
    }
    get id() {
      return this.nft;
    }
  }
  StablePool2.State = State;
  let Datum;
  ((Datum2) => {
    function toPlutusData(datum) {
      const { balances, totalLiquidity, amplificationCoefficient, orderHash } = datum;
      return new Constr(0, [
        balances,
        totalLiquidity,
        amplificationCoefficient,
        orderHash
      ]);
    }
    Datum2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      if (data.index !== 0) {
        throw new Error(`Index of Pool Datum must be 0, actual: ${data.index}`);
      }
      return {
        balances: data.fields[0],
        totalLiquidity: data.fields[1],
        amplificationCoefficient: data.fields[2],
        orderHash: data.fields[3]
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
  })(Datum = StablePool2.Datum || (StablePool2.Datum = {}));
})(StablePool || (StablePool = {}));
var PoolV2;
((PoolV22) => {
  PoolV22.MAX_LIQUIDITY = 9223372036854775807n;
  PoolV22.DEFAULT_POOL_ADA = 4500000n;
  PoolV22.MINIMUM_LIQUIDITY = 10n;
  PoolV22.DEFAULT_TRADING_FEE_DENOMINATOR = 10000n;
  function computeLPAssetName(assetA, assetB) {
    const [normalizedA, normalizedB] = normalizeAssets(
      Asset.toString(assetA),
      Asset.toString(assetB)
    );
    const normalizedAssetA = Asset.fromString(normalizedA);
    const normalizedAssetB = Asset.fromString(normalizedB);
    const k1 = sha3(normalizedAssetA.policyId + normalizedAssetA.tokenName);
    const k2 = sha3(normalizedAssetB.policyId + normalizedAssetB.tokenName);
    return sha3(k1 + k2);
  }
  PoolV22.computeLPAssetName = computeLPAssetName;
  class State {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$c(this, "address");
      __publicField$c(this, "txIn");
      __publicField$c(this, "value");
      __publicField$c(this, "datumRaw");
      __publicField$c(this, "datum");
      __publicField$c(this, "config");
      __publicField$c(this, "lpAsset");
      __publicField$c(this, "authenAsset");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumRaw = datum;
      this.datum = Datum.fromPlutusData(DataObject.from(datum));
      this.config = DexV2Constant.CONFIG[networkId];
      this.lpAsset = {
        policyId: this.config.lpPolicyId,
        tokenName: computeLPAssetName(this.datum.assetA, this.datum.assetB)
      };
      this.authenAsset = Asset.fromString(this.config.poolAuthenAsset);
      if (!value.find(
        (v) => v.unit === this.config.poolAuthenAsset && v.quantity === "1"
      )) {
        throw new Error(
          "Cannot find the Pool Authentication Asset in the value"
        );
      }
    }
    get assetA() {
      return Asset.toString(this.datum.assetA);
    }
    get assetB() {
      return Asset.toString(this.datum.assetB);
    }
    get totalLiquidity() {
      return this.datum.totalLiquidity;
    }
    get reserveA() {
      return this.datum.reserveA;
    }
    get reserveB() {
      return this.datum.reserveB;
    }
    get feeA() {
      return [
        this.datum.baseFee.feeANumerator,
        DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR
      ];
    }
    get feeB() {
      return [
        this.datum.baseFee.feeBNumerator,
        DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR
      ];
    }
    get feeShare() {
      if (this.datum.feeSharingNumerator !== void 0) {
        return [
          this.datum.feeSharingNumerator,
          DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR
        ];
      } else {
        return void 0;
      }
    }
    get datumReserves() {
      return [this.datum.reserveA, this.datum.reserveB];
    }
    get valueReserveA() {
      const amount = BigInt(
        this.value.find((v) => v.unit === this.assetA)?.quantity ?? "0"
      );
      if (Asset.equals(this.datum.assetA, ADA)) {
        return amount - PoolV22.DEFAULT_POOL_ADA;
      }
      return amount;
    }
    get valueReserveB() {
      return BigInt(
        this.value.find((v) => v.unit === this.assetB)?.quantity ?? "0"
      );
    }
    get valueReserves() {
      return [this.valueReserveA, this.valueReserveB];
    }
    get info() {
      return {
        datumReserves: this.datumReserves,
        valueReserves: this.valueReserves,
        totalLiquidity: this.datum.totalLiquidity,
        tradingFee: this.datum.baseFee,
        feeSharingNumerator: this.datum.feeSharingNumerator
      };
    }
  }
  PoolV22.State = State;
  let Datum;
  ((Datum2) => {
    function toPlutusData(datum) {
      const {
        poolBatchingStakeCredential,
        assetA,
        assetB,
        totalLiquidity,
        reserveA,
        reserveB,
        baseFee,
        feeSharingNumerator,
        allowDynamicFee
      } = datum;
      return new Constr(0, [
        new Constr(0, [
          LucidCredential.toPlutusData(poolBatchingStakeCredential)
        ]),
        Asset.toPlutusData(assetA),
        Asset.toPlutusData(assetB),
        totalLiquidity,
        reserveA,
        reserveB,
        baseFee.feeANumerator,
        baseFee.feeBNumerator,
        feeSharingNumerator !== void 0 ? new Constr(0, [feeSharingNumerator]) : new Constr(1, []),
        new Constr(allowDynamicFee ? 1 : 0, [])
      ]);
    }
    Datum2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      if (data.index !== 0) {
        throw new Error(`Index of Pool Datum must be 0, actual: ${data.index}`);
      }
      const stakeCredentialConstr = data.fields[0];
      if (stakeCredentialConstr.index !== 0) {
        throw new Error(
          `Index of Stake Credential must be 0, actual: ${stakeCredentialConstr.index}`
        );
      }
      let feeSharingNumerator = void 0;
      const maybeFeeSharingConstr = data.fields[8];
      switch (maybeFeeSharingConstr.index) {
        case 0: {
          feeSharingNumerator = maybeFeeSharingConstr.fields[0];
          break;
        }
        case 1: {
          feeSharingNumerator = void 0;
          break;
        }
        default: {
          throw new Error(
            `Index of Pool Fee Sharing must be 0 or 1, actual: ${maybeFeeSharingConstr.index}`
          );
        }
      }
      const allowDynamicFeeConstr = data.fields[9];
      const allowDynamicFee = allowDynamicFeeConstr.index === 1;
      return {
        poolBatchingStakeCredential: LucidCredential.fromPlutusData(
          stakeCredentialConstr.fields[0]
        ),
        assetA: Asset.fromPlutusData(data.fields[1]),
        assetB: Asset.fromPlutusData(data.fields[2]),
        totalLiquidity: data.fields[3],
        reserveA: data.fields[4],
        reserveB: data.fields[5],
        baseFee: {
          feeANumerator: data.fields[6],
          feeBNumerator: data.fields[7]
        },
        feeSharingNumerator,
        allowDynamicFee
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
  })(Datum = PoolV22.Datum || (PoolV22.Datum = {}));
})(PoolV2 || (PoolV2 = {}));

var Slippage;
((Slippage2) => {
  function apply({
    slippage,
    amount,
    type
  }) {
    switch (type) {
      case "up": {
        const slippageAdjustedAmount = new BigNumber(1).plus(slippage).multipliedBy(amount.toString());
        return BigInt(slippageAdjustedAmount.toFixed(0, BigNumber.ROUND_DOWN));
      }
      case "down": {
        const slippageAdjustedAmount = new BigNumber(1).div(new BigNumber(1).plus(slippage)).multipliedBy(amount.toString());
        return BigInt(slippageAdjustedAmount.toFixed(0, BigNumber.ROUND_DOWN));
      }
    }
  }
  Slippage2.apply = apply;
})(Slippage || (Slippage = {}));

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
function sqrt(value) {
  invariant(value >= 0n, "NEGATIVE");
  if (value < MAX_SAFE_INTEGER) {
    return BigInt(Math.floor(Math.sqrt(Number(value))));
  }
  let z;
  let x;
  z = value;
  x = value / 2n + 1n;
  while (x < z) {
    z = x;
    x = (value / x + x) / 2n;
  }
  return z;
}

function calculateSwapExactIn(options) {
  const { amountIn, reserveIn, reserveOut } = options;
  const amtOutNumerator = amountIn * 997n * reserveOut;
  const amtOutDenominator = amountIn * 997n + reserveIn * 1000n;
  const priceImpactNumerator = reserveOut * amountIn * amtOutDenominator * 997n - amtOutNumerator * reserveIn * 1000n;
  const priceImpactDenominator = reserveOut * amountIn * amtOutDenominator * 1000n;
  return {
    amountOut: amtOutNumerator / amtOutDenominator,
    priceImpact: new Big(priceImpactNumerator.toString()).mul(new Big(100)).div(new Big(priceImpactDenominator.toString()))
  };
}
function calculateSwapExactOut(options) {
  const { exactAmountOut, reserveIn, reserveOut } = options;
  const amtInNumerator = reserveIn * exactAmountOut * 1000n;
  const amtInDenominator = (reserveOut - exactAmountOut) * 997n;
  const priceImpactNumerator = reserveOut * amtInNumerator * 997n - exactAmountOut * amtInDenominator * reserveIn * 1000n;
  const priceImpactDenominator = reserveOut * amtInNumerator * 1000n;
  return {
    amountIn: amtInNumerator / amtInDenominator + 1n,
    priceImpact: new Big(priceImpactNumerator.toString()).mul(new Big(100)).div(new Big(priceImpactDenominator.toString()))
  };
}
function calculateAmountWithSlippageTolerance(options) {
  const { slippageTolerancePercent, amount, type } = options;
  const slippageTolerance = new BigNumber(slippageTolerancePercent).div(100);
  return Slippage.apply({
    slippage: slippageTolerance,
    amount,
    type
  });
}
function calculateDeposit(options) {
  const {
    depositedAmountA,
    depositedAmountB,
    reserveA,
    reserveB,
    totalLiquidity
  } = options;
  const deltaLiquidityA = depositedAmountA * totalLiquidity / reserveA;
  const deltaLiquidityB = depositedAmountB * totalLiquidity / reserveB;
  let necessaryAmountA, necessaryAmountB, lpAmount;
  if (deltaLiquidityA > deltaLiquidityB) {
    necessaryAmountA = depositedAmountB * reserveA / reserveB;
    necessaryAmountB = depositedAmountB;
    lpAmount = deltaLiquidityB;
  } else if (deltaLiquidityA < deltaLiquidityB) {
    necessaryAmountA = depositedAmountA;
    necessaryAmountB = depositedAmountA * reserveB / reserveA;
    lpAmount = deltaLiquidityA;
  } else {
    necessaryAmountA = depositedAmountA;
    necessaryAmountB = depositedAmountB;
    lpAmount = deltaLiquidityA;
  }
  return {
    necessaryAmountA,
    necessaryAmountB,
    lpAmount
  };
}
function calculateWithdraw(options) {
  const { withdrawalLPAmount, reserveA, reserveB, totalLiquidity } = options;
  return {
    amountAReceive: withdrawalLPAmount * reserveA / totalLiquidity,
    amountBReceive: withdrawalLPAmount * reserveB / totalLiquidity
  };
}
function calculateZapIn(options) {
  const { amountIn, reserveIn, reserveOut, totalLiquidity } = options;
  const swapAmountIn = (sqrt(
    1997n ** 2n * reserveIn ** 2n + 4n * 997n * 1000n * amountIn * reserveIn
  ) - 1997n * reserveIn) / (2n * 997n);
  const swapToAssetOutAmount = calculateSwapExactIn({
    amountIn: swapAmountIn,
    reserveIn,
    reserveOut
  }).amountOut;
  return swapToAssetOutAmount * totalLiquidity / (reserveOut - swapToAssetOutAmount);
}
var DexV2Calculation;
((DexV2Calculation2) => {
  function bigIntPow(x) {
    return x * x;
  }
  DexV2Calculation2.bigIntPow = bigIntPow;
  function calculateInitialLiquidity({
    amountA,
    amountB
  }) {
    let x = sqrt(amountA * amountB);
    if (x * x < amountA * amountB) {
      x += 1n;
    }
    return x;
  }
  DexV2Calculation2.calculateInitialLiquidity = calculateInitialLiquidity;
  function calculateAmountOut({
    reserveIn,
    reserveOut,
    amountIn,
    tradingFeeNumerator
  }) {
    const diff = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator;
    const inWithFee = diff * amountIn;
    const numerator = inWithFee * reserveOut;
    const denominator = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR * reserveIn + inWithFee;
    return numerator / denominator;
  }
  DexV2Calculation2.calculateAmountOut = calculateAmountOut;
  function calculateAmountOutFraction({
    reserveIn,
    reserveOut,
    amountIn,
    tradingFeeNumerator
  }) {
    const [amountInNumerator, amountInDenominator] = amountIn;
    const diff = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator;
    const numerator = amountInNumerator * diff * reserveOut;
    const denominator = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR * amountInDenominator * reserveIn + amountInNumerator * diff;
    return [numerator, denominator];
  }
  DexV2Calculation2.calculateAmountOutFraction = calculateAmountOutFraction;
  function calculateAmountIn({
    reserveIn,
    reserveOut,
    amountOut,
    tradingFeeNumerator
  }) {
    if (amountOut >= reserveOut) {
      throw new Error("Amount Out must be less than Reserve Out");
    }
    const diff = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator;
    const numerator = reserveIn * amountOut * PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR;
    const denominator = (reserveOut - amountOut) * diff;
    return numerator / denominator + 1n;
  }
  DexV2Calculation2.calculateAmountIn = calculateAmountIn;
  function calculateMaxInSwap({
    reserveIn,
    reserveOut,
    tradingFeeNumerator,
    ioRatio
  }) {
    const [ioRatioNumerator, ioRatioDenominator] = ioRatio;
    const diff = PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator;
    const numerator = ioRatioNumerator * diff * reserveOut - ioRatioDenominator * PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR * reserveIn;
    const denominator = ioRatioDenominator * diff;
    const maxInSwap = numerator / denominator;
    return maxInSwap > 0 ? maxInSwap : 0n;
  }
  DexV2Calculation2.calculateMaxInSwap = calculateMaxInSwap;
  function calculateDepositAmount({
    amountA,
    amountB,
    poolInfo
  }) {
    const { datumReserves, totalLiquidity, tradingFee } = poolInfo;
    const [datumReserveA, datumReserveB] = [...datumReserves];
    const ratioA = amountA * totalLiquidity / datumReserveA;
    const ratioB = amountB * totalLiquidity / datumReserveB;
    if (ratioA > ratioB) {
      const swapAmountA = calculateDepositSwapAmount({
        amountIn: amountA,
        amountOut: amountB,
        reserveIn: datumReserveA,
        reserveOut: datumReserveB,
        tradingFeeNumerator: tradingFee.feeANumerator
      });
      const [swapAmountANumerator, swapAmountADenominator] = swapAmountA;
      const lpAmount = (amountA * swapAmountADenominator - swapAmountANumerator) * totalLiquidity / (datumReserveA * swapAmountADenominator + swapAmountANumerator);
      return lpAmount;
    } else if (ratioA < ratioB) {
      const swapAmountB = calculateDepositSwapAmount({
        amountIn: amountB,
        amountOut: amountA,
        reserveIn: datumReserveB,
        reserveOut: datumReserveA,
        tradingFeeNumerator: tradingFee.feeBNumerator
      });
      const [swapAmountBNumerator, swapAmountBDenominator] = swapAmountB;
      const lpAmount = (amountB * swapAmountBDenominator - swapAmountBNumerator) * totalLiquidity / (datumReserveB * swapAmountBDenominator + swapAmountBNumerator);
      return lpAmount;
    } else {
      return ratioA;
    }
  }
  DexV2Calculation2.calculateDepositAmount = calculateDepositAmount;
  function calculateDepositSwapAmount({
    amountIn,
    amountOut,
    reserveIn,
    reserveOut,
    tradingFeeNumerator
  }) {
    const x = (amountOut + reserveOut) * reserveIn;
    const y = 4n * (amountOut + reserveOut) * (amountOut * reserveIn * reserveIn - amountIn * reserveIn * reserveOut);
    const z = 2n * (amountOut + reserveOut);
    const a = bigIntPow(x) * bigIntPow(
      2n * PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator
    ) - y * PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR * (PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator);
    const b = (2n * PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator) * x;
    const numerator = sqrt(a) - b;
    const denominator = z * (PoolV2.DEFAULT_TRADING_FEE_DENOMINATOR - tradingFeeNumerator);
    return [numerator, denominator];
  }
  DexV2Calculation2.calculateDepositSwapAmount = calculateDepositSwapAmount;
  function calculateWithdrawAmount({
    withdrawalLPAmount,
    datumReserves,
    totalLiquidity
  }) {
    const [datumReserveA, datumReserveB] = [...datumReserves];
    const amountA = withdrawalLPAmount * datumReserveA / totalLiquidity;
    const amountB = withdrawalLPAmount * datumReserveB / totalLiquidity;
    return {
      withdrawalA: amountA,
      withdrawalB: amountB
    };
  }
  DexV2Calculation2.calculateWithdrawAmount = calculateWithdrawAmount;
  function calculateZapOutAmount({
    withdrawalLPAmount,
    direction,
    poolInfo
  }) {
    const { datumReserves, totalLiquidity, tradingFee } = poolInfo;
    const [datumReserveA, datumReserveB] = [...datumReserves];
    const { withdrawalA, withdrawalB } = calculateWithdrawAmount({
      withdrawalLPAmount,
      datumReserves,
      totalLiquidity
    });
    const reserveAAfterWithdraw = datumReserveA - withdrawalA;
    const reserveBAfterWithdraw = datumReserveB - withdrawalB;
    let amountOut = 0n;
    switch (direction) {
      case OrderV2.Direction.A_TO_B: {
        const extraAmountOut = calculateAmountOut({
          amountIn: withdrawalA,
          reserveIn: reserveAAfterWithdraw,
          reserveOut: reserveBAfterWithdraw,
          tradingFeeNumerator: tradingFee.feeANumerator
        });
        amountOut = withdrawalB + extraAmountOut;
        return amountOut;
      }
      case OrderV2.Direction.B_TO_A: {
        const extraAmountOut = calculateAmountOut({
          amountIn: withdrawalB,
          reserveIn: reserveBAfterWithdraw,
          reserveOut: reserveAAfterWithdraw,
          tradingFeeNumerator: tradingFee.feeBNumerator
        });
        amountOut = withdrawalA + extraAmountOut;
        return amountOut;
      }
    }
  }
  DexV2Calculation2.calculateZapOutAmount = calculateZapOutAmount;
})(DexV2Calculation || (DexV2Calculation = {}));
var StableswapCalculation;
((StableswapCalculation2) => {
  function getD(mulBalances, amp) {
    const sumMulBalances = mulBalances.reduce(
      (sum, balance) => sum + balance,
      0n
    );
    if (sumMulBalances === 0n) {
      return 0n;
    }
    const length = BigInt(mulBalances.length);
    let dPrev = 0n;
    let d = sumMulBalances;
    const ann = amp * length;
    for (let i = 0; i < 255; i++) {
      let dp = d;
      for (const mulBalance of mulBalances) {
        dp = dp * d / (mulBalance * length);
      }
      dPrev = d;
      d = (ann * sumMulBalances + dp * length) * d / ((ann - 1n) * d + (length + 1n) * dp);
      if (d > dPrev) {
        if (d - dPrev <= 1n) {
          break;
        }
      } else {
        if (dPrev - d <= 1n) {
          break;
        }
      }
    }
    return d;
  }
  StableswapCalculation2.getD = getD;
  function getY(i, j, x, xp, amp) {
    if (i === j || i < 0 || j < 0 || i >= xp.length || j >= xp.length) {
      throw Error(
        `getY failed: i and j must be different and less than length of xp`
      );
    }
    const length = BigInt(xp.length);
    const d = getD(xp, amp);
    let c = d;
    let s = 0n;
    const ann = amp * length;
    let _x = 0n;
    for (let index = 0; index < Number(length); index++) {
      if (index === i) {
        _x = x;
      } else if (index !== j) {
        _x = xp[index];
      } else {
        continue;
      }
      s += _x;
      c = c * d / (_x * length);
    }
    c = c * d / (ann * length);
    const b = s + d / ann;
    let yPrev = 0n;
    let y = d;
    for (let index = 0; index < 255; index++) {
      yPrev = y;
      y = (y * y + c) / (2n * y + b - d);
      if (y > yPrev) {
        if (y - yPrev <= 1n) {
          break;
        }
      } else {
        if (yPrev - y <= 1n) {
          break;
        }
      }
    }
    return y;
  }
  StableswapCalculation2.getY = getY;
  function getYD(i, xp, amp, d) {
    const length = BigInt(xp.length);
    invariant(
      0 <= i && i < xp.length,
      `getYD failed: i must be less than length of xp`
    );
    let c = d;
    let s = 0n;
    const ann = amp * length;
    let _x = 0n;
    for (let index = 0; index < Number(length); index++) {
      if (index !== i) {
        _x = xp[index];
      } else {
        continue;
      }
      s += _x;
      c = c * d / (_x * length);
    }
    c = c * d / (ann * length);
    const b = s + d / ann;
    let yPrev = 0n;
    let y = d;
    for (let index = 0; index < 255; index++) {
      yPrev = y;
      y = (y * y + c) / (2n * y + b - d);
      if (y > yPrev) {
        if (y - yPrev <= 1n) {
          break;
        }
      } else {
        if (yPrev - y <= 1n) {
          break;
        }
      }
    }
    return y;
  }
  StableswapCalculation2.getYD = getYD;
  function getDMem(balances, multiples, amp) {
    const mulBalances = zipWith(balances, multiples, (a, b) => a * b);
    return getD(mulBalances, amp);
  }
  StableswapCalculation2.getDMem = getDMem;
  function calculateSwapAmount({
    inIndex,
    outIndex,
    amountIn,
    amp,
    multiples,
    datumBalances,
    fee,
    adminFee,
    feeDenominator
  }) {
    const tempDatumBalances = [...datumBalances];
    const length = multiples.length;
    invariant(
      amountIn > 0,
      `calculateExchange error: amountIn ${amountIn} must be positive.`
    );
    invariant(
      0 <= inIndex && inIndex < length,
      `calculateExchange error: inIndex ${inIndex} is not valid, must be within 0-${length - 1}`
    );
    invariant(
      0 <= outIndex && outIndex < length,
      `calculateExchange error: outIndex ${outIndex} is not valid, must be within 0-${length - 1}`
    );
    invariant(inIndex !== outIndex, `inIndex must be different from outIndex`);
    const mulBalances = zipWith(tempDatumBalances, multiples, (a, b) => a * b);
    const mulIn = multiples[inIndex];
    const mulOut = multiples[outIndex];
    const x = mulBalances[inIndex] + amountIn * mulIn;
    const y = getY(inIndex, outIndex, x, mulBalances, amp);
    const dy = mulBalances[outIndex] - y;
    const dyFee = dy * fee / feeDenominator;
    const dyAdminFee = dyFee * adminFee / feeDenominator;
    const amountOut = (dy - dyFee) / mulOut;
    const newDatumBalanceOut = (y + (dyFee - dyAdminFee)) / mulOut;
    invariant(
      amountOut > 0,
      `calculateExchange error: amountIn is too small, amountOut (${amountOut}) must be positive.`
    );
    invariant(
      newDatumBalanceOut > 0,
      `calculateExchange error: newDatumBalanceOut (${newDatumBalanceOut}) must be positive.`
    );
    return amountOut;
  }
  StableswapCalculation2.calculateSwapAmount = calculateSwapAmount;
  function calculateDeposit2({
    amountIns,
    amp,
    multiples,
    datumBalances,
    totalLiquidity,
    fee,
    adminFee,
    feeDenominator
  }) {
    const tempDatumBalances = [...datumBalances];
    const length = multiples.length;
    invariant(
      amountIns.length === length,
      `calculateDeposit error: amountIns's length ${amountIns.length} is invalid, amountIns's length must be ${length}`
    );
    let newDatumBalances = [];
    let lpAmount = 0n;
    if (totalLiquidity === 0n) {
      for (let i = 0; i < length; ++i) {
        invariant(
          amountIns[i] > 0n,
          `calculateDeposit error: amount index ${i} must be positive in case totalLiquidity = 0`
        );
      }
      newDatumBalances = zipWith(tempDatumBalances, amountIns, (a, b) => a + b);
      const d1 = getDMem(newDatumBalances, multiples, amp);
      invariant(
        d1 > 0,
        `calculateDeposit: d1 must be greater than 0 in case totalLiquidity = 0`
      );
      lpAmount = d1;
    } else {
      let sumIns = 0n;
      for (let i = 0; i < length; ++i) {
        if (amountIns[i] < 0n) {
          invariant(
            amountIns[i] > 0n,
            `calculateDeposit error: amountIns index ${i} must be non-negative`
          );
        }
        sumIns += amountIns[i];
      }
      invariant(
        sumIns > 0,
        `calculateDeposit error: sum of amountIns must be positive`
      );
      const newDatumBalanceWithoutFee = zipWith(
        tempDatumBalances,
        amountIns,
        (a, b) => a + b
      );
      const d0 = getDMem(tempDatumBalances, multiples, amp);
      const d1 = getDMem(newDatumBalanceWithoutFee, multiples, amp);
      invariant(
        d1 > d0,
        `calculateDeposit: d1 must be greater than d0 in case totalLiquidity > 0, d1: ${d1}, d0: ${d0}`
      );
      const specialFee = fee * BigInt(length) / (4n * (BigInt(length) - 1n));
      const newDatBalancesWithTradingFee = [];
      for (let i = 0; i < tempDatumBalances.length; i++) {
        const oldBalance = tempDatumBalances[i];
        const newBalance = newDatumBalanceWithoutFee[i];
        const idealBalance = d1 * oldBalance / d0;
        let different = 0n;
        if (newBalance > idealBalance) {
          different = newBalance - idealBalance;
        } else {
          different = idealBalance - newBalance;
        }
        const tradingFeeAmount = specialFee * different / feeDenominator;
        const adminFeeAmount = tradingFeeAmount * adminFee / feeDenominator;
        newDatumBalances.push(newBalance - adminFeeAmount);
        newDatBalancesWithTradingFee.push(newBalance - tradingFeeAmount);
      }
      for (let i = 0; i < length; ++i) {
        invariant(
          newDatBalancesWithTradingFee[i] > 0,
          `calculateDeposit error: deposit amount is too small, newDatBalancesWithTradingFee must be positive`
        );
      }
      const d2 = getDMem(newDatBalancesWithTradingFee, multiples, amp);
      lpAmount = totalLiquidity * (d2 - d0) / d0;
    }
    invariant(
      lpAmount > 0,
      `calculateDeposit error: deposit amount is too small, lpAmountOut ${lpAmount} must be positive`
    );
    return lpAmount;
  }
  StableswapCalculation2.calculateDeposit = calculateDeposit2;
  function calculateWithdraw2({
    withdrawalLPAmount,
    multiples,
    datumBalances,
    totalLiquidity
  }) {
    const tempDatumBalances = [...datumBalances];
    const length = multiples.length;
    invariant(
      withdrawalLPAmount > 0,
      `calculateWithdraw error: withdrawalLPAmount must be positive`
    );
    const amountOuts = tempDatumBalances.map(
      (balance) => balance * withdrawalLPAmount / totalLiquidity
    );
    let sumOuts = 0n;
    for (let i = 0; i < length; ++i) {
      invariant(
        amountOuts[i] >= 0n,
        `calculateWithdraw error: amountOuts must be non-negative`
      );
      sumOuts += amountOuts[i];
    }
    invariant(
      sumOuts > 0n,
      `calculateWithdraw error: sum of amountOuts must be positive`
    );
    return amountOuts;
  }
  StableswapCalculation2.calculateWithdraw = calculateWithdraw2;
  function calculateWithdrawImbalance({
    withdrawAmounts,
    amp,
    multiples,
    datumBalances,
    totalLiquidity,
    fee,
    feeDenominator
  }) {
    const tempDatumBalances = [...datumBalances];
    const length = multiples.length;
    invariant(
      withdrawAmounts.length === length,
      `calculateWithdrawImbalance error: withdrawAmounts's length ${withdrawAmounts.length} is invalid, withdrawAmounts's length must be ${length}`
    );
    let sumOuts = 0n;
    for (let i = 0; i < length; ++i) {
      invariant(
        withdrawAmounts[i] >= 0n,
        `calculateDeposit error: amountIns must be non-negative`
      );
      sumOuts += withdrawAmounts[i];
    }
    invariant(
      sumOuts > 0n,
      `calculateWithdrawImbalance error: sum of withdrawAmounts must be positive`
    );
    const specialFee = fee * BigInt(length) / (4n * (BigInt(length) - 1n));
    const newDatBalancesWithoutFee = zipWith(
      tempDatumBalances,
      withdrawAmounts,
      (a, b) => a - b
    );
    for (let i = 0; i < length; ++i) {
      invariant(
        newDatBalancesWithoutFee[i] > 0n,
        `calculateWithdrawImbalance error: not enough asset index ${i}`
      );
    }
    const d0 = getDMem(tempDatumBalances, multiples, amp);
    const d1 = getDMem(newDatBalancesWithoutFee, multiples, amp);
    const newDatBalancesWithTradingFee = [];
    for (let i = 0; i < length; ++i) {
      const idealBalance = d1 * tempDatumBalances[i] / d0;
      let different = 0n;
      if (newDatBalancesWithoutFee[i] > idealBalance) {
        different = newDatBalancesWithoutFee[i] - idealBalance;
      } else {
        different = idealBalance - newDatBalancesWithoutFee[i];
      }
      const tradingFeeAmount = specialFee * different / feeDenominator;
      newDatBalancesWithTradingFee.push(
        newDatBalancesWithoutFee[i] - tradingFeeAmount
      );
    }
    for (let i = 0; i < length; ++i) {
      invariant(
        newDatBalancesWithTradingFee[i] > 0n,
        `calculateWithdrawImbalance error: not enough asset index ${i}`
      );
    }
    const d2 = getDMem(newDatBalancesWithTradingFee, multiples, amp);
    let lpAmount = (d0 - d2) * totalLiquidity / d0;
    invariant(
      lpAmount > 0n,
      `calculateWithdrawImbalance error: required lpAmount ${lpAmount} must be positive`
    );
    lpAmount += 1n;
    return lpAmount;
  }
  StableswapCalculation2.calculateWithdrawImbalance = calculateWithdrawImbalance;
  function calculateZapOut({
    amountLpIn,
    outIndex,
    amp,
    multiples,
    datumBalances,
    totalLiquidity,
    fee,
    adminFee,
    feeDenominator
  }) {
    const tempDatumBalances = [...datumBalances];
    const length = multiples.length;
    invariant(
      amountLpIn > 0,
      `calculateZapOut error: amountLpIn ${amountLpIn} must be positive.`
    );
    invariant(
      0 <= outIndex && outIndex < length,
      `calculateZapOut error: outIndex ${outIndex} is not valid, must be within 0-${length - 1}`
    );
    const mulBalances = zipWith(tempDatumBalances, multiples, (a, b) => a * b);
    const mulOut = multiples[outIndex];
    const d0 = getD(mulBalances, amp);
    const d1 = d0 - amountLpIn * d0 / totalLiquidity;
    const mulBalancesReduced = mulBalances;
    const newYWithoutFee = getYD(outIndex, mulBalances, amp, d1);
    const specialFee = fee * BigInt(length) / (4n * (BigInt(length) - 1n));
    const amountOutWithoutFee = (mulBalances[outIndex] - newYWithoutFee) / mulOut;
    for (let i = 0; i < length; ++i) {
      const diff = i === outIndex ? mulBalances[i] * d1 / d0 - newYWithoutFee : mulBalances[i] - mulBalances[i] * d1 / d0;
      mulBalancesReduced[i] -= diff * specialFee / feeDenominator;
    }
    const newY = getYD(outIndex, mulBalancesReduced, amp, d1);
    const amountOut = (mulBalancesReduced[outIndex] - newY - 1n) / mulOut;
    tempDatumBalances[outIndex] -= amountOut + (amountOutWithoutFee - amountOut) * adminFee / feeDenominator;
    return amountOut;
  }
  StableswapCalculation2.calculateZapOut = calculateZapOut;
  function getPrice(balances, multiples, amp, assetAIndex, assetBIndex) {
    const mulBalances = zipWith(balances, multiples, (a, b) => a * b);
    const length = BigInt(mulBalances.length);
    const ann = amp * length;
    const d = getD(mulBalances, amp);
    let drNumerator = d;
    let drDenominator = 1n;
    for (let i = 0n; i < length; ++i) {
      drNumerator = drNumerator * d;
      drDenominator = drDenominator * mulBalances[Number(i)] * length;
    }
    return shortenFraction([
      (drDenominator * ann * mulBalances[assetAIndex] * mulBalances[assetBIndex] + drNumerator * mulBalances[assetAIndex]) * multiples[assetBIndex],
      mulBalances[assetBIndex] * (drDenominator * ann * mulBalances[assetAIndex] + drNumerator) * multiples[assetAIndex]
    ]);
  }
  StableswapCalculation2.getPrice = getPrice;
})(StableswapCalculation || (StableswapCalculation = {}));
function shortenFraction([numerator, denominator]) {
  const gcd = gcdFunction(numerator, denominator);
  if (gcd === 0n) {
    return [1n, 1n];
  } else {
    return [numerator / gcd, denominator / gcd];
  }
}
function gcdFunction(a, b) {
  if (a > b) {
    if (b === 0n) {
      return a;
    }
    return gcdFunction(a % b, b);
  } else if (a < b) {
    if (a === 0n) {
      return b;
    }
    return gcdFunction(a, b % a);
  }
  return a;
}
function compareUtxo(s1, s2) {
  if (s1.txHash === s2.txHash) {
    return s1.outputIndex - s2.outputIndex;
  }
  if (s1.txHash < s2.txHash) {
    return -1;
  }
  if (s1.txHash === s2.txHash) {
    return 0;
  }
  return 1;
}

var __defProp$b = Object.defineProperty;
var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$b = (obj, key, value) => __defNormalProp$b(obj, typeof key !== "symbol" ? key + "" : key, value);
var FactoryV2;
((FactoryV22) => {
  let Datum;
  ((Datum2) => {
    function toPlutusData(datum) {
      return new Constr(0, [
        datum.head,
        datum.tail
      ]);
    }
    Datum2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      if (data.index !== 0) {
        throw new Error(`Index of Factory V2 Datum must be 0, actual: ${data.index}`);
      }
      return {
        head: data.fields[0],
        tail: data.fields[1]
      };
    }
    Datum2.fromPlutusData = fromPlutusData;
  })(Datum = FactoryV22.Datum || (FactoryV22.Datum = {}));
  ((Redeemer2) => {
    function toPlutusData(redeemer) {
      return new Constr(0, [
        Asset.toPlutusData(redeemer.assetA),
        Asset.toPlutusData(redeemer.assetB)
      ]);
    }
    Redeemer2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      if (data.index !== 0) {
        throw new Error(`Index of Factory V2 Datum must be 0, actual: ${data.index}`);
      }
      return {
        assetA: Asset.fromPlutusData(data.fields[0]),
        assetB: Asset.fromPlutusData(data.fields[1])
      };
    }
    Redeemer2.fromPlutusData = fromPlutusData;
  })(FactoryV22.Redeemer || (FactoryV22.Redeemer = {}));
  class State {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$b(this, "address");
      __publicField$b(this, "txIn");
      __publicField$b(this, "value");
      __publicField$b(this, "datumCbor");
      __publicField$b(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = Datum.fromPlutusData(DataObject.from(datum));
      const config = DexV2Constant.CONFIG[networkId];
      if (!value.find((v) => v.unit === config.factoryAsset && v.quantity === "1")) {
        throw new Error("Cannot find the Factory Authentication Asset in the value");
      }
    }
    get head() {
      return this.datum.head;
    }
    get tail() {
      return this.datum.tail;
    }
  }
  FactoryV22.State = State;
})(FactoryV2 || (FactoryV2 = {}));

var Options;
((Options2) => {
  function toPlutusData(data, toPlutusDataFn) {
    return data !== void 0 ? new Constr(0, [toPlutusDataFn(data)]) : new Constr(1, []);
  }
  Options2.toPlutusData = toPlutusData;
  function fromPlutusData(data, fromPlutusDataFn) {
    switch (data.index) {
      case 0: {
        return fromPlutusDataFn(data.fields[0]);
      }
      case 1: {
        return void 0;
      }
      default: {
        throw Error(`Index of Options must be 0 or 1, actual: ${data.index}`);
      }
    }
  }
  Options2.fromPlutusData = fromPlutusData;
})(Options || (Options = {}));
var Bool;
((Bool2) => {
  function toPlutusData(data) {
    return data ? new Constr(1, []) : new Constr(0, []);
  }
  Bool2.toPlutusData = toPlutusData;
  function fromPlutusData(data) {
    switch (data.index) {
      case 0: {
        return false;
      }
      case 1: {
        return true;
      }
      default: {
        throw Error(`Index of Bool must be 0 or 1, actual: ${data.index}`);
      }
    }
  }
  Bool2.fromPlutusData = fromPlutusData;
})(Bool || (Bool = {}));
var RedeemerWrapper;
((RedeemerWrapper2) => {
  function toPlutusData(d) {
    return new Constr(1, [d]);
  }
  RedeemerWrapper2.toPlutusData = toPlutusData;
  function fromPlutusData(data) {
    switch (data.index) {
      case 1: {
        return data.fields[0];
      }
      default: {
        throw Error(
          `Index of RedeemerWrapper must be 1, actual: ${data.index}`
        );
      }
    }
  }
  RedeemerWrapper2.fromPlutusData = fromPlutusData;
})(RedeemerWrapper || (RedeemerWrapper = {}));

var __defProp$a = Object.defineProperty;
var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$a = (obj, key, value) => __defNormalProp$a(obj, typeof key !== "symbol" ? key + "" : key, value);
var LbeV2Types;
((LbeV2Types2) => {
  ((ReceiverDatumType2) => {
    ReceiverDatumType2[ReceiverDatumType2["NO_DATUM"] = 0] = "NO_DATUM";
    ReceiverDatumType2[ReceiverDatumType2["DATUM_HASH"] = 1] = "DATUM_HASH";
    ReceiverDatumType2[ReceiverDatumType2["INLINE_DATUM"] = 2] = "INLINE_DATUM";
  })(LbeV2Types2.ReceiverDatumType || (LbeV2Types2.ReceiverDatumType = {}));
  let ReceiverDatum;
  ((ReceiverDatum2) => {
    function toPlutusData(data) {
      switch (data.type) {
        case 0 /* NO_DATUM */: {
          return new Constr(0, []);
        }
        case 1 /* DATUM_HASH */: {
          return new Constr(1, [data.hash]);
        }
        case 2 /* INLINE_DATUM */: {
          return new Constr(2, [data.hash]);
        }
      }
    }
    ReceiverDatum2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      switch (data.index) {
        case 0 /* NO_DATUM */: {
          invariant(
            data.fields.length === 0,
            `NO_DATUM Receiver Datum fields length must be 0, actual: ${data.fields.length}`
          );
          return { type: 0 /* NO_DATUM */ };
        }
        case 1 /* DATUM_HASH */: {
          invariant(
            data.fields.length === 1,
            `DATUM_HASH Receiver Datum fields length must be 1, actual: ${data.fields.length}`
          );
          return {
            type: 1 /* DATUM_HASH */,
            hash: data.fields[0]
          };
        }
        case 2 /* INLINE_DATUM */: {
          invariant(
            data.fields.length === 1,
            `INLINE_DATUM Receiver Datum fields length must be 1, actual: ${data.fields.length}`
          );
          return {
            type: 2 /* INLINE_DATUM */,
            hash: data.fields[0]
          };
        }
        default: {
          throw Error(
            `Index of Receiver Datum must be 0, 1 or 2, actual: ${data.index}`
          );
        }
      }
    }
    ReceiverDatum2.fromPlutusData = fromPlutusData;
  })(ReceiverDatum = LbeV2Types2.ReceiverDatum || (LbeV2Types2.ReceiverDatum = {}));
  let PenaltyConfig;
  ((PenaltyConfig2) => {
    function toPlutusData(data) {
      return new Constr(0, [data.penaltyStartTime, data.percent]);
    }
    PenaltyConfig2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      switch (data.index) {
        case 0: {
          invariant(
            data.fields.length === 2,
            `Penalty Config fields length must be 2, actual: ${data.fields.length}`
          );
          return {
            penaltyStartTime: data.fields[0],
            percent: data.fields[1]
          };
        }
        default: {
          throw Error(
            `Index of Penalty Config must be 0, actual: ${data.index}`
          );
        }
      }
    }
    PenaltyConfig2.fromPlutusData = fromPlutusData;
  })(PenaltyConfig = LbeV2Types2.PenaltyConfig || (LbeV2Types2.PenaltyConfig = {}));
  let TreasuryDatum;
  ((TreasuryDatum2) => {
    function toPlutusData(datum) {
      const {
        factoryPolicyId,
        managerHash,
        sellerHash,
        orderHash,
        baseAsset,
        raiseAsset,
        startTime,
        endTime,
        owner,
        receiver,
        receiverDatum,
        poolAllocation,
        minimumOrderRaise,
        minimumRaise,
        maximumRaise,
        reserveBase,
        penaltyConfig,
        poolBaseFee,
        revocable,
        collectedFund,
        reserveRaise,
        totalPenalty,
        totalLiquidity,
        isCancelled,
        isManagerCollected
      } = datum;
      return new Constr(0, [
        factoryPolicyId,
        managerHash,
        sellerHash,
        orderHash,
        Asset.toPlutusData(baseAsset),
        Asset.toPlutusData(raiseAsset),
        startTime,
        endTime,
        AddressPlutusData.toPlutusData(owner),
        AddressPlutusData.toPlutusData(receiver),
        ReceiverDatum.toPlutusData(receiverDatum),
        poolAllocation,
        Options.toPlutusData(minimumOrderRaise, (x) => x),
        Options.toPlutusData(minimumRaise, (x) => x),
        Options.toPlutusData(maximumRaise, (x) => x),
        reserveBase,
        Options.toPlutusData(penaltyConfig, PenaltyConfig.toPlutusData),
        poolBaseFee,
        Bool.toPlutusData(revocable),
        collectedFund,
        reserveRaise,
        totalPenalty,
        totalLiquidity,
        Bool.toPlutusData(isCancelled),
        Bool.toPlutusData(isManagerCollected)
      ]);
    }
    TreasuryDatum2.toPlutusData = toPlutusData;
    function fromPlutusData(networkId, data) {
      if (data.index !== 0) {
        throw new Error(
          `Index of Treasury Datum must be 0, actual: ${data.index}`
        );
      }
      invariant(
        data.fields.length === 25,
        `Treasury Datum fields length must be 25, actual: ${data.fields.length}`
      );
      const fields = data.fields;
      return {
        factoryPolicyId: fields[0],
        managerHash: fields[1],
        sellerHash: fields[2],
        orderHash: fields[3],
        baseAsset: Asset.fromPlutusData(fields[4]),
        raiseAsset: Asset.fromPlutusData(fields[5]),
        startTime: fields[6],
        endTime: fields[7],
        owner: AddressPlutusData.fromPlutusData(
          networkId,
          fields[8]
        ),
        receiver: AddressPlutusData.fromPlutusData(
          networkId,
          fields[9]
        ),
        receiverDatum: ReceiverDatum.fromPlutusData(fields[10]),
        poolAllocation: fields[11],
        minimumOrderRaise: Options.fromPlutusData(
          fields[12],
          (data2) => data2
        ),
        minimumRaise: Options.fromPlutusData(
          fields[13],
          (data2) => data2
        ),
        maximumRaise: Options.fromPlutusData(
          fields[14],
          (data2) => data2
        ),
        reserveBase: fields[15],
        penaltyConfig: Options.fromPlutusData(
          fields[16],
          (data2) => PenaltyConfig.fromPlutusData(data2)
        ),
        poolBaseFee: fields[17],
        revocable: Bool.fromPlutusData(fields[18]),
        collectedFund: fields[19],
        reserveRaise: fields[20],
        totalPenalty: fields[21],
        totalLiquidity: fields[22],
        isCancelled: Bool.fromPlutusData(fields[23]),
        isManagerCollected: Bool.fromPlutusData(fields[24])
      };
    }
    TreasuryDatum2.fromPlutusData = fromPlutusData;
  })(TreasuryDatum = LbeV2Types2.TreasuryDatum || (LbeV2Types2.TreasuryDatum = {}));
  ((TreasuryRedeemerType2) => {
    TreasuryRedeemerType2[TreasuryRedeemerType2["COLLECT_MANAGER"] = 0] = "COLLECT_MANAGER";
    TreasuryRedeemerType2[TreasuryRedeemerType2["COLLECT_ORDERS"] = 1] = "COLLECT_ORDERS";
    TreasuryRedeemerType2[TreasuryRedeemerType2["CREATE_AMM_POOL"] = 2] = "CREATE_AMM_POOL";
    TreasuryRedeemerType2[TreasuryRedeemerType2["REDEEM_ORDERS"] = 3] = "REDEEM_ORDERS";
    TreasuryRedeemerType2[TreasuryRedeemerType2["CLOSE_EVENT"] = 4] = "CLOSE_EVENT";
    TreasuryRedeemerType2[TreasuryRedeemerType2["CANCEL_LBE"] = 5] = "CANCEL_LBE";
    TreasuryRedeemerType2[TreasuryRedeemerType2["UPDATE_LBE"] = 6] = "UPDATE_LBE";
  })(LbeV2Types2.TreasuryRedeemerType || (LbeV2Types2.TreasuryRedeemerType = {}));
  ((CancelReason2) => {
    CancelReason2[CancelReason2["CREATED_POOL"] = 0] = "CREATED_POOL";
    CancelReason2[CancelReason2["BY_OWNER"] = 1] = "BY_OWNER";
    CancelReason2[CancelReason2["NOT_REACH_MINIMUM"] = 2] = "NOT_REACH_MINIMUM";
  })(LbeV2Types2.CancelReason || (LbeV2Types2.CancelReason = {}));
  ((TreasuryRedeemer2) => {
    function toPlutusData(data) {
      switch (data.type) {
        case 0 /* COLLECT_MANAGER */:
        case 1 /* COLLECT_ORDERS */:
        case 2 /* CREATE_AMM_POOL */:
        case 3 /* REDEEM_ORDERS */:
        case 4 /* CLOSE_EVENT */:
        case 6 /* UPDATE_LBE */: {
          return new Constr(data.type, []);
        }
        case 5 /* CANCEL_LBE */: {
          return new Constr(data.type, [new Constr(data.reason, [])]);
        }
      }
    }
    TreasuryRedeemer2.toPlutusData = toPlutusData;
  })(LbeV2Types2.TreasuryRedeemer || (LbeV2Types2.TreasuryRedeemer = {}));
  class TreasuryState {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$a(this, "address");
      __publicField$a(this, "txIn");
      __publicField$a(this, "value");
      __publicField$a(this, "datumCbor");
      __publicField$a(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = TreasuryDatum.fromPlutusData(networkId, DataObject.from(datum));
      const config = LbeV2Constant.CONFIG[networkId];
      if (!value.find(
        (v) => v.unit === config.treasuryAsset && v.quantity === "1"
      )) {
        throw new Error(
          "Cannot find the Treasury Authentication Asset in the value"
        );
      }
    }
    get lbeId() {
      return PoolV2.computeLPAssetName(
        this.datum.baseAsset,
        this.datum.raiseAsset
      );
    }
  }
  LbeV2Types2.TreasuryState = TreasuryState;
  ((LbeV2Parameters2) => {
    function toLbeV2TreasuryDatum(networkId, lbeV2Parameters) {
      const config = LbeV2Constant.CONFIG[networkId];
      const treasuryDatum = {
        factoryPolicyId: config.factoryHash,
        managerHash: config.managerHash,
        sellerHash: config.sellerHash,
        orderHash: config.orderHash,
        baseAsset: lbeV2Parameters.baseAsset,
        raiseAsset: lbeV2Parameters.raiseAsset,
        startTime: lbeV2Parameters.startTime,
        endTime: lbeV2Parameters.endTime,
        owner: lbeV2Parameters.owner,
        receiver: lbeV2Parameters.receiver,
        receiverDatum: {
          type: 0 /* NO_DATUM */
        },
        poolAllocation: lbeV2Parameters.poolAllocation,
        minimumOrderRaise: lbeV2Parameters.minimumOrderRaise,
        minimumRaise: lbeV2Parameters.minimumRaise,
        maximumRaise: lbeV2Parameters.maximumRaise,
        reserveBase: lbeV2Parameters.reserveBase,
        penaltyConfig: lbeV2Parameters.penaltyConfig,
        poolBaseFee: lbeV2Parameters.poolBaseFee,
        revocable: lbeV2Parameters.revocable,
        collectedFund: 0n,
        reserveRaise: 0n,
        totalPenalty: 0n,
        totalLiquidity: 0n,
        isCancelled: false,
        isManagerCollected: false
      };
      return treasuryDatum;
    }
    LbeV2Parameters2.toLbeV2TreasuryDatum = toLbeV2TreasuryDatum;
  })(LbeV2Types2.LbeV2Parameters || (LbeV2Types2.LbeV2Parameters = {}));
  let FactoryDatum;
  ((FactoryDatum2) => {
    function toPlutusData(data) {
      return new Constr(0, [data.head, data.tail]);
    }
    FactoryDatum2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      switch (data.index) {
        case 0: {
          invariant(
            data.fields.length === 2,
            `Factory Datum fields length must be 2, actual: ${data.fields.length}`
          );
          return {
            head: data.fields[0],
            tail: data.fields[1]
          };
        }
        default: {
          throw Error(`Index of FactoryDatum must be 0, actual: ${data.index}`);
        }
      }
    }
    FactoryDatum2.fromPlutusData = fromPlutusData;
  })(FactoryDatum = LbeV2Types2.FactoryDatum || (LbeV2Types2.FactoryDatum = {}));
  ((FactoryRedeemerType2) => {
    FactoryRedeemerType2[FactoryRedeemerType2["INITIALIZATION"] = 0] = "INITIALIZATION";
    FactoryRedeemerType2[FactoryRedeemerType2["CREATE_TREASURY"] = 1] = "CREATE_TREASURY";
    FactoryRedeemerType2[FactoryRedeemerType2["CLOSE_TREASURY"] = 2] = "CLOSE_TREASURY";
    FactoryRedeemerType2[FactoryRedeemerType2["MINT_MANAGER"] = 3] = "MINT_MANAGER";
    FactoryRedeemerType2[FactoryRedeemerType2["MINT_SELLER"] = 4] = "MINT_SELLER";
    FactoryRedeemerType2[FactoryRedeemerType2["BURN_SELLER"] = 5] = "BURN_SELLER";
    FactoryRedeemerType2[FactoryRedeemerType2["MINT_ORDER"] = 6] = "MINT_ORDER";
    FactoryRedeemerType2[FactoryRedeemerType2["MINT_REDEEM_ORDERS"] = 7] = "MINT_REDEEM_ORDERS";
    FactoryRedeemerType2[FactoryRedeemerType2["MANAGE_ORDER"] = 8] = "MANAGE_ORDER";
  })(LbeV2Types2.FactoryRedeemerType || (LbeV2Types2.FactoryRedeemerType = {}));
  ((FactoryRedeemer2) => {
    function toPlutusData(data) {
      switch (data.type) {
        case 0 /* INITIALIZATION */:
        case 3 /* MINT_MANAGER */:
        case 4 /* MINT_SELLER */:
        case 5 /* BURN_SELLER */:
        case 6 /* MINT_ORDER */:
        case 7 /* MINT_REDEEM_ORDERS */:
        case 8 /* MANAGE_ORDER */: {
          return new Constr(data.type, []);
        }
        case 1 /* CREATE_TREASURY */:
        case 2 /* CLOSE_TREASURY */: {
          return new Constr(data.type, [
            Asset.toPlutusData(data.baseAsset),
            Asset.toPlutusData(data.raiseAsset)
          ]);
        }
      }
    }
    FactoryRedeemer2.toPlutusData = toPlutusData;
  })(LbeV2Types2.FactoryRedeemer || (LbeV2Types2.FactoryRedeemer = {}));
  class FactoryState {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$a(this, "address");
      __publicField$a(this, "txIn");
      __publicField$a(this, "value");
      __publicField$a(this, "datumCbor");
      __publicField$a(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = FactoryDatum.fromPlutusData(DataObject.from(datum));
      const config = LbeV2Constant.CONFIG[networkId];
      if (!value.find((v) => v.unit === config.factoryAsset && v.quantity === "1")) {
        throw new Error(
          "Cannot find the Factory Authentication Asset in the value"
        );
      }
    }
    get head() {
      return this.datum.head;
    }
    get tail() {
      return this.datum.tail;
    }
  }
  LbeV2Types2.FactoryState = FactoryState;
  let ManagerDatum;
  ((ManagerDatum2) => {
    function toPlutusData(data) {
      return new Constr(0, [
        data.factoryPolicyId,
        Asset.toPlutusData(data.baseAsset),
        Asset.toPlutusData(data.raiseAsset),
        data.sellerCount,
        data.reserveRaise,
        data.totalPenalty
      ]);
    }
    ManagerDatum2.toPlutusData = toPlutusData;
    function fromPlutusData(data) {
      switch (data.index) {
        case 0: {
          const fields = data.fields;
          invariant(
            fields.length === 6,
            `Manager Datum fields length must be 6, actual: ${fields.length}`
          );
          return {
            factoryPolicyId: fields[0],
            baseAsset: Asset.fromPlutusData(fields[1]),
            raiseAsset: Asset.fromPlutusData(fields[2]),
            sellerCount: fields[3],
            reserveRaise: fields[4],
            totalPenalty: fields[5]
          };
        }
        default: {
          throw Error(`Index of FactoryDatum must be 0, actual: ${data.index}`);
        }
      }
    }
    ManagerDatum2.fromPlutusData = fromPlutusData;
  })(ManagerDatum = LbeV2Types2.ManagerDatum || (LbeV2Types2.ManagerDatum = {}));
  ((ManagerRedeemer2) => {
    ManagerRedeemer2[ManagerRedeemer2["ADD_SELLERS"] = 0] = "ADD_SELLERS";
    ManagerRedeemer2[ManagerRedeemer2["COLLECT_SELLERS"] = 1] = "COLLECT_SELLERS";
    ManagerRedeemer2[ManagerRedeemer2["SPEND_MANAGER"] = 2] = "SPEND_MANAGER";
  })(LbeV2Types2.ManagerRedeemer || (LbeV2Types2.ManagerRedeemer = {}));
  ((ManagerRedeemer2) => {
    function toPlutusData(data) {
      return new Constr(data, []);
    }
    ManagerRedeemer2.toPlutusData = toPlutusData;
  })(LbeV2Types2.ManagerRedeemer || (LbeV2Types2.ManagerRedeemer = {}));
  class ManagerState {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$a(this, "address");
      __publicField$a(this, "txIn");
      __publicField$a(this, "value");
      __publicField$a(this, "datumCbor");
      __publicField$a(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = ManagerDatum.fromPlutusData(DataObject.from(datum));
      const config = LbeV2Constant.CONFIG[networkId];
      if (!value.find((v) => v.unit === config.managerAsset && v.quantity === "1")) {
        throw new Error(
          "Cannot find the Manager Authentication Asset in the value"
        );
      }
    }
    get lbeId() {
      return PoolV2.computeLPAssetName(
        this.datum.baseAsset,
        this.datum.raiseAsset
      );
    }
  }
  LbeV2Types2.ManagerState = ManagerState;
  let SellerDatum;
  ((SellerDatum2) => {
    function toPlutusData(data) {
      return new Constr(0, [
        data.factoryPolicyId,
        AddressPlutusData.toPlutusData(data.owner),
        Asset.toPlutusData(data.baseAsset),
        Asset.toPlutusData(data.raiseAsset),
        data.amount,
        data.penaltyAmount
      ]);
    }
    SellerDatum2.toPlutusData = toPlutusData;
    function fromPlutusData(data, networkId) {
      switch (data.index) {
        case 0: {
          const fields = data.fields;
          invariant(
            fields.length === 6,
            `Seller Datum fields length must be 6, actual: ${fields.length}`
          );
          return {
            factoryPolicyId: fields[0],
            owner: AddressPlutusData.fromPlutusData(
              networkId,
              fields[1]
            ),
            baseAsset: Asset.fromPlutusData(fields[2]),
            raiseAsset: Asset.fromPlutusData(fields[3]),
            amount: fields[4],
            penaltyAmount: fields[5]
          };
        }
        default: {
          throw Error(`Index of SellerDatum must be 0, actual: ${data.index}`);
        }
      }
    }
    SellerDatum2.fromPlutusData = fromPlutusData;
  })(SellerDatum = LbeV2Types2.SellerDatum || (LbeV2Types2.SellerDatum = {}));
  ((SellerRedeemer2) => {
    SellerRedeemer2[SellerRedeemer2["USING_SELLER"] = 0] = "USING_SELLER";
    SellerRedeemer2[SellerRedeemer2["COUNTING_SELLERS"] = 1] = "COUNTING_SELLERS";
  })(LbeV2Types2.SellerRedeemer || (LbeV2Types2.SellerRedeemer = {}));
  ((SellerRedeemer2) => {
    function toPlutusData(data) {
      return new Constr(data, []);
    }
    SellerRedeemer2.toPlutusData = toPlutusData;
  })(LbeV2Types2.SellerRedeemer || (LbeV2Types2.SellerRedeemer = {}));
  class SellerState {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$a(this, "address");
      __publicField$a(this, "txIn");
      __publicField$a(this, "value");
      __publicField$a(this, "datumCbor");
      __publicField$a(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = SellerDatum.fromPlutusData(DataObject.from(datum), networkId);
      const config = LbeV2Constant.CONFIG[networkId];
      if (!value.find((v) => v.unit === config.sellerAsset && v.quantity === "1")) {
        throw new Error(
          "Cannot find the Seller Authentication Asset in the value"
        );
      }
    }
    get lbeId() {
      return PoolV2.computeLPAssetName(
        this.datum.baseAsset,
        this.datum.raiseAsset
      );
    }
  }
  LbeV2Types2.SellerState = SellerState;
  let OrderDatum;
  ((OrderDatum2) => {
    function toPlutusData(data) {
      return new Constr(0, [
        data.factoryPolicyId,
        Asset.toPlutusData(data.baseAsset),
        Asset.toPlutusData(data.raiseAsset),
        AddressPlutusData.toPlutusData(data.owner),
        data.amount,
        Bool.toPlutusData(data.isCollected),
        data.penaltyAmount
      ]);
    }
    OrderDatum2.toPlutusData = toPlutusData;
    function fromPlutusData(data, networkId) {
      switch (data.index) {
        case 0: {
          const fields = data.fields;
          invariant(
            fields.length === 7,
            `Order Datum fields length must be 7, actual: ${fields.length}`
          );
          return {
            factoryPolicyId: fields[0],
            baseAsset: Asset.fromPlutusData(fields[1]),
            raiseAsset: Asset.fromPlutusData(fields[2]),
            owner: AddressPlutusData.fromPlutusData(
              networkId,
              fields[3]
            ),
            amount: fields[4],
            isCollected: Bool.fromPlutusData(fields[5]),
            penaltyAmount: fields[6]
          };
        }
        default: {
          throw Error(`Index of OrderDatum must be 0, actual: ${data.index}`);
        }
      }
    }
    OrderDatum2.fromPlutusData = fromPlutusData;
  })(OrderDatum = LbeV2Types2.OrderDatum || (LbeV2Types2.OrderDatum = {}));
  ((OrderRedeemer2) => {
    OrderRedeemer2[OrderRedeemer2["UPDATE_ORDER"] = 0] = "UPDATE_ORDER";
    OrderRedeemer2[OrderRedeemer2["COLLECT_ORDER"] = 1] = "COLLECT_ORDER";
    OrderRedeemer2[OrderRedeemer2["REDEEM_ORDER"] = 2] = "REDEEM_ORDER";
  })(LbeV2Types2.OrderRedeemer || (LbeV2Types2.OrderRedeemer = {}));
  ((OrderRedeemer2) => {
    function toPlutusData(data) {
      return new Constr(data, []);
    }
    OrderRedeemer2.toPlutusData = toPlutusData;
  })(LbeV2Types2.OrderRedeemer || (LbeV2Types2.OrderRedeemer = {}));
  class OrderState {
    constructor(networkId, address, txIn, value, datum) {
      __publicField$a(this, "address");
      __publicField$a(this, "txIn");
      __publicField$a(this, "value");
      __publicField$a(this, "datumCbor");
      __publicField$a(this, "datum");
      this.address = address;
      this.txIn = txIn;
      this.value = value;
      this.datumCbor = datum;
      this.datum = OrderDatum.fromPlutusData(DataObject.from(datum), networkId);
      const config = LbeV2Constant.CONFIG[networkId];
      if (!value.find((v) => v.unit === config.orderAsset && v.quantity === "1")) {
        throw new Error(
          "Cannot find the Order Authentication Asset in the value"
        );
      }
    }
    get lbeId() {
      return PoolV2.computeLPAssetName(
        this.datum.baseAsset,
        this.datum.raiseAsset
      );
    }
    get owner() {
      return this.datum.owner;
    }
  }
  LbeV2Types2.OrderState = OrderState;
})(LbeV2Types || (LbeV2Types = {}));

var __defProp$9 = Object.defineProperty;
var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$9 = (obj, key, value) => __defNormalProp$9(obj, typeof key !== "symbol" ? key + "" : key, value);
class BlockfrostAdapter {
  constructor(networkId, blockFrostApi) {
    __publicField$9(this, "networkId");
    __publicField$9(this, "blockFrostApi");
    this.networkId = networkId;
    this.blockFrostApi = blockFrostApi;
  }
  async getAssetDecimals(asset) {
    if (asset === "lovelace") {
      return 6;
    }
    try {
      const assetAInfo = await this.blockFrostApi.assetsById(asset);
      return assetAInfo.metadata?.decimals ?? 0;
    } catch (err) {
      if (err instanceof BlockfrostServerError && err.status_code === 404) {
        return 0;
      }
      throw err;
    }
  }
  async getDatumByDatumHash(datumHash) {
    const scriptsDatum = await this.blockFrostApi.scriptsDatumCbor(datumHash);
    return scriptsDatum.cbor;
  }
  async currentSlot() {
    const latestBlock = await this.blockFrostApi.blocksLatest();
    return latestBlock.slot ?? 0;
  }
  // MARK: DEX V1
  async getV1PoolInTx({
    txHash
  }) {
    const poolTx = await this.blockFrostApi.txsUtxos(txHash);
    const poolUtxo = poolTx.outputs.find(
      (o) => getScriptHashFromAddress(o.address) === DexV1Constant.POOL_SCRIPT_HASH
    );
    if (!poolUtxo) {
      return null;
    }
    checkValidPoolOutput(poolUtxo.address, poolUtxo.amount, poolUtxo.data_hash);
    invariant(
      poolUtxo.data_hash,
      `expect pool to have datum hash, got ${poolUtxo.data_hash}`
    );
    const txIn = { txHash, index: poolUtxo.output_index };
    return new PoolV1.State(
      poolUtxo.address,
      txIn,
      poolUtxo.amount,
      poolUtxo.data_hash
    );
  }
  async getV1PoolById({
    id
  }) {
    const nft = `${DexV1Constant.POOL_NFT_POLICY_ID}${id}`;
    const nftTxs = await this.blockFrostApi.assetsTransactions(nft, {
      count: 1,
      page: 1,
      order: "desc"
    });
    if (nftTxs.length === 0) {
      return null;
    }
    return this.getV1PoolInTx({ txHash: nftTxs[0].tx_hash });
  }
  async getV1Pools({
    page = 1,
    count = 100,
    order = "asc"
  }) {
    const utxos = await this.blockFrostApi.addressesUtxos(
      DexV1Constant.POOL_SCRIPT_HASH,
      { count, order, page }
    );
    return utxos.filter(
      (utxo) => isValidPoolOutput(utxo.address, utxo.amount, utxo.data_hash)
    ).map((utxo) => {
      invariant(
        utxo.data_hash,
        `expect pool to have datum hash, got ${utxo.data_hash}`
      );
      const txIn = {
        txHash: utxo.tx_hash,
        index: utxo.output_index
      };
      return new PoolV1.State(
        utxo.address,
        txIn,
        utxo.amount,
        utxo.data_hash
      );
    });
  }
  async getV1PoolHistory({ page = 1, count = 100, order = "desc" }, { id }) {
    const nft = `${DexV1Constant.POOL_NFT_POLICY_ID}${id}`;
    const nftTxs = await this.blockFrostApi.assetsTransactions(nft, {
      count,
      page,
      order
    });
    return nftTxs.map(
      (tx) => ({
        txHash: tx.tx_hash,
        txIndex: tx.tx_index,
        blockHeight: tx.block_height,
        time: new Date(Number(tx.block_time) * 1e3)
      })
    );
  }
  async getV1PoolPrice({
    pool,
    decimalsA,
    decimalsB
  }) {
    if (decimalsA === void 0) {
      decimalsA = await this.getAssetDecimals(pool.assetA);
    }
    if (decimalsB === void 0) {
      decimalsB = await this.getAssetDecimals(pool.assetB);
    }
    const adjustedReserveA = Big(pool.reserveA.toString()).div(
      Big(10).pow(decimalsA)
    );
    const adjustedReserveB = Big(pool.reserveB.toString()).div(
      Big(10).pow(decimalsB)
    );
    const priceAB = adjustedReserveA.div(adjustedReserveB);
    const priceBA = adjustedReserveB.div(adjustedReserveA);
    return [priceAB, priceBA];
  }
  // MARK: DEX V2
  async getAllV2Pools() {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      v2Config.poolScriptHashBech32,
      v2Config.poolAuthenAsset
    );
    const pools = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(`Cannot find datum of Pool V2, tx: ${utxo.tx_hash}`);
        }
        const pool = new PoolV2.State(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        pools.push(pool);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      pools,
      errors
    };
  }
  async getV2Pools({
    page = 1,
    count = 100,
    order = "asc"
  }) {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAsset(
      v2Config.poolScriptHashBech32,
      v2Config.poolAuthenAsset,
      { count, order, page }
    );
    const pools = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(`Cannot find datum of Pool V2, tx: ${utxo.tx_hash}`);
        }
        const pool = new PoolV2.State(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        pools.push(pool);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      pools,
      errors
    };
  }
  async getV2PoolByPair(assetA, assetB) {
    const [normalizedAssetA, normalizedAssetB] = normalizeAssets(
      Asset.toString(assetA),
      Asset.toString(assetB)
    );
    const { pools: allPools } = await this.getAllV2Pools();
    return allPools.find(
      (pool) => pool.assetA === normalizedAssetA && pool.assetB === normalizedAssetB
    ) ?? null;
  }
  async getV2PoolByLp(lpAsset) {
    const { pools: allPools } = await this.getAllV2Pools();
    return allPools.find((pool) => Asset.compare(pool.lpAsset, lpAsset) === 0) ?? null;
  }
  async getV2PoolPrice({
    pool,
    decimalsA,
    decimalsB
  }) {
    if (decimalsA === void 0) {
      decimalsA = await this.getAssetDecimals(pool.assetA);
    }
    if (decimalsB === void 0) {
      decimalsB = await this.getAssetDecimals(pool.assetB);
    }
    const adjustedReserveA = Big(pool.reserveA.toString()).div(
      Big(10).pow(decimalsA)
    );
    const adjustedReserveB = Big(pool.reserveB.toString()).div(
      Big(10).pow(decimalsB)
    );
    const priceAB = adjustedReserveA.div(adjustedReserveB);
    const priceBA = adjustedReserveB.div(adjustedReserveA);
    return [priceAB, priceBA];
  }
  async getAllFactoriesV2() {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      v2Config.factoryScriptHashBech32,
      v2Config.factoryAsset
    );
    const factories = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(
            `Cannot find datum of Factory V2, tx: ${utxo.tx_hash}`
          );
        }
        const factory = new FactoryV2.State(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        factories.push(factory);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      factories,
      errors
    };
  }
  async getFactoryV2ByPair(assetA, assetB) {
    const factoryIdent = PoolV2.computeLPAssetName(assetA, assetB);
    const { factories: allFactories } = await this.getAllFactoriesV2();
    for (const factory of allFactories) {
      if (StringUtils.compare(factory.head, factoryIdent) < 0 && StringUtils.compare(factoryIdent, factory.tail) < 0) {
        return factory;
      }
    }
    return null;
  }
  async getAllV2Orders() {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAll(
      v2Config.orderScriptHashBech32
    );
    const orders = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        let order = void 0;
        if (utxo.inline_datum !== null) {
          order = new OrderV2.State(
            this.networkId,
            utxo.address,
            { txHash: utxo.tx_hash, index: utxo.output_index },
            utxo.amount,
            utxo.inline_datum
          );
        } else if (utxo.data_hash !== null) {
          const orderDatum = await this.blockFrostApi.scriptsDatumCbor(
            utxo.data_hash
          );
          order = new OrderV2.State(
            this.networkId,
            utxo.address,
            { txHash: utxo.tx_hash, index: utxo.output_index },
            utxo.amount,
            orderDatum.cbor
          );
        }
        if (order === void 0) {
          throw new Error(`Cannot find datum of Order V2, tx: ${utxo.tx_hash}`);
        }
        orders.push(order);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      orders,
      errors
    };
  }
  // MARK: STABLESWAP
  async parseStablePoolState(utxo) {
    let datum;
    if (utxo.inline_datum) {
      datum = utxo.inline_datum;
    } else if (utxo.data_hash) {
      datum = await this.getDatumByDatumHash(utxo.data_hash);
    } else {
      throw new Error("Cannot find datum of Stable Pool");
    }
    const pool = new StablePool.State(
      this.networkId,
      utxo.address,
      { txHash: utxo.tx_hash, index: utxo.output_index },
      utxo.amount,
      datum
    );
    return pool;
  }
  async getAllStablePools() {
    const poolAddresses = StableswapConstant.CONFIG[this.networkId].map(
      (cfg) => cfg.poolAddress
    );
    const pools = [];
    const errors = [];
    for (const poolAddr of poolAddresses) {
      const utxos = await this.blockFrostApi.addressesUtxosAll(poolAddr);
      try {
        for (const utxo of utxos) {
          const pool = await this.parseStablePoolState(utxo);
          pools.push(pool);
        }
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      pools,
      errors
    };
  }
  async getStablePoolByLpAsset(lpAsset) {
    const config = StableswapConstant.CONFIG[this.networkId].find(
      (cfg) => cfg.lpAsset === Asset.toString(lpAsset)
    );
    invariant(
      config,
      `getStablePoolByLpAsset: Can not find stableswap config by LP Asset ${Asset.toString(
        lpAsset
      )}`
    );
    const poolUtxos = await this.blockFrostApi.addressesUtxosAssetAll(
      config.poolAddress,
      config.nftAsset
    );
    if (poolUtxos.length === 1) {
      const poolUtxo = poolUtxos[0];
      return await this.parseStablePoolState(poolUtxo);
    }
    return null;
  }
  async getStablePoolByNFT(nft) {
    const poolAddress = StableswapConstant.CONFIG[this.networkId].find(
      (cfg) => cfg.nftAsset === Asset.toString(nft)
    )?.poolAddress;
    if (!poolAddress) {
      throw new Error(
        `Cannot find Stable Pool having NFT ${Asset.toString(nft)}`
      );
    }
    const poolUtxos = await this.blockFrostApi.addressesUtxosAssetAll(
      poolAddress,
      Asset.toString(nft)
    );
    if (poolUtxos.length === 1) {
      const poolUtxo = poolUtxos[0];
      return await this.parseStablePoolState(poolUtxo);
    }
    return null;
  }
  getStablePoolPrice({
    pool,
    assetAIndex,
    assetBIndex
  }) {
    const config = pool.config;
    const [priceNum, priceDen] = StableswapCalculation.getPrice(
      pool.datum.balances,
      config.multiples,
      pool.amp,
      assetAIndex,
      assetBIndex
    );
    return Big(priceNum.toString()).div(priceDen.toString());
  }
  // MARK: LBE V2
  async getAllLbeV2Factories() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      config.factoryHashBech32,
      config.factoryAsset
    );
    const factories = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(
            `Cannot find datum of LBE V2 Factory, tx: ${utxo.tx_hash}`
          );
        }
        const factory = new LbeV2Types.FactoryState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        factories.push(factory);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      factories,
      errors
    };
  }
  async getLbeV2Factory(baseAsset, raiseAsset) {
    const factoryIdent = PoolV2.computeLPAssetName(baseAsset, raiseAsset);
    const { factories: allFactories } = await this.getAllLbeV2Factories();
    for (const factory of allFactories) {
      if (StringUtils.compare(factory.head, factoryIdent) < 0 && StringUtils.compare(factoryIdent, factory.tail) < 0) {
        return factory;
      }
    }
    return null;
  }
  async getLbeV2HeadAndTailFactory(lbeId) {
    const { factories: allFactories } = await this.getAllLbeV2Factories();
    let head = void 0;
    let tail = void 0;
    for (const factory of allFactories) {
      if (factory.head === lbeId) {
        tail = factory;
      }
      if (factory.tail === lbeId) {
        head = factory;
      }
    }
    if (head === void 0 || tail === void 0) {
      return null;
    }
    return { head, tail };
  }
  async getAllLbeV2Treasuries() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      config.treasuryHashBech32,
      config.treasuryAsset
    );
    const treasuries = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(
            `Cannot find datum of LBE V2 Treasury, tx: ${utxo.tx_hash}`
          );
        }
        const treasury = new LbeV2Types.TreasuryState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        treasuries.push(treasury);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      treasuries,
      errors
    };
  }
  async getLbeV2TreasuryByLbeId(lbeId) {
    const { treasuries: allTreasuries } = await this.getAllLbeV2Treasuries();
    for (const treasury of allTreasuries) {
      if (treasury.lbeId === lbeId) {
        return treasury;
      }
    }
    return null;
  }
  async getAllLbeV2Managers() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      config.managerHashBech32,
      config.managerAsset
    );
    const managers = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(
            `Cannot find datum of Lbe V2 Manager, tx: ${utxo.tx_hash}`
          );
        }
        const manager = new LbeV2Types.ManagerState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        managers.push(manager);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      managers,
      errors
    };
  }
  async getLbeV2ManagerByLbeId(lbeId) {
    const { managers } = await this.getAllLbeV2Managers();
    for (const manager of managers) {
      if (manager.lbeId === lbeId) {
        return manager;
      }
    }
    return null;
  }
  async getAllLbeV2Sellers() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      config.sellerHashBech32,
      config.sellerAsset
    );
    const sellers = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(
            `Cannot find datum of Lbe V2 Seller, tx: ${utxo.tx_hash}`
          );
        }
        const seller = new LbeV2Types.SellerState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        sellers.push(seller);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      sellers,
      errors
    };
  }
  async getLbeV2SellerByLbeId(lbeId) {
    const { sellers } = await this.getAllLbeV2Sellers();
    for (const seller of sellers) {
      if (seller.lbeId === lbeId) {
        return seller;
      }
    }
    return null;
  }
  async getAllLbeV2Orders() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxos = await this.blockFrostApi.addressesUtxosAssetAll(
      config.orderHashBech32,
      config.orderAsset
    );
    const orders = [];
    const errors = [];
    for (const utxo of utxos) {
      try {
        if (!utxo.inline_datum) {
          throw new Error(
            `Cannot find datum of Lbe V2 Order, tx: ${utxo.tx_hash}`
          );
        }
        const order = new LbeV2Types.OrderState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.output_index },
          utxo.amount,
          utxo.inline_datum
        );
        orders.push(order);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      orders,
      errors
    };
  }
  async getLbeV2OrdersByLbeId(lbeId) {
    const { orders: allOrders } = await this.getAllLbeV2Orders();
    const orders = [];
    for (const order of allOrders) {
      if (order.lbeId === lbeId) {
        orders.push(order);
      }
    }
    return orders;
  }
  async getLbeV2OrdersByLbeIdAndOwner(lbeId, owner) {
    const { orders: allOrders } = await this.getAllLbeV2Orders();
    const orders = [];
    for (const order of allOrders) {
      if (order.lbeId === lbeId && order.owner === owner) {
        orders.push(order);
      }
    }
    return orders;
  }
}

var __defProp$8 = Object.defineProperty;
var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$8 = (obj, key, value) => __defNormalProp$8(obj, typeof key !== "symbol" ? key + "" : key, value);
class MaestroAdapter {
  constructor(networkId, maestroClient) {
    __publicField$8(this, "networkId");
    __publicField$8(this, "maestroClient");
    this.networkId = networkId;
    this.maestroClient = maestroClient;
  }
  mapMaestroAssetToValue(assets) {
    return assets.map((asset) => ({
      unit: asset.unit.toString(),
      quantity: asset.amount.toString()
    }));
  }
  async getAllUtxosDataByPaymentCred(credential, queryParams) {
    let cursor = null;
    const utxosData = [];
    if (!queryParams) {
      queryParams = {};
    }
    do {
      queryParams.cursor = cursor;
      const utxos = await this.maestroClient.addresses.utxosByPaymentCred(
        credential,
        queryParams
      );
      utxosData.push(...utxos.data);
      cursor = utxos.next_cursor;
    } while (cursor);
    return utxosData;
  }
  async getAssetDecimals(asset) {
    if (asset === "lovelace") {
      return 6;
    }
    try {
      const assetAInfo = await this.maestroClient.assets.assetInfo(asset);
      return assetAInfo.data.token_registry_metadata?.decimals ?? 0;
    } catch {
      return 0;
    }
  }
  async getDatumByDatumHash(datumHash) {
    const scriptsDatum = await this.maestroClient.datum.lookupDatum(datumHash);
    return scriptsDatum.data.bytes;
  }
  async currentSlot() {
    const latestBlock = (await this.maestroClient.blocks.blockLatest()).data.absolute_slot;
    return latestBlock ?? 0;
  }
  async getV1PoolInTx({
    txHash
  }) {
    const poolTx = await this.maestroClient.transactions.txInfo(txHash);
    const poolUtxo = poolTx.data.outputs.find(
      (o) => getScriptHashFromAddress(o.address) === DexV1Constant.POOL_SCRIPT_HASH
    );
    if (!poolUtxo) {
      return null;
    }
    const poolUtxoAmount = this.mapMaestroAssetToValue(poolUtxo.assets);
    const poolUtxoDatumHash = poolUtxo.datum?.hash ?? "";
    checkValidPoolOutput(poolUtxo.address, poolUtxoAmount, poolUtxoDatumHash);
    invariant(
      poolUtxoDatumHash,
      `expect pool to have datum hash, got ${poolUtxoDatumHash}`
    );
    const txIn = { txHash, index: poolUtxo.index };
    return new PoolV1.State(
      poolUtxo.address,
      txIn,
      poolUtxoAmount,
      poolUtxoDatumHash
    );
  }
  async getV1PoolById({
    id
  }) {
    const nft = `${DexV1Constant.POOL_NFT_POLICY_ID}${id}`;
    const nftTxs = await this.maestroClient.assets.assetTxs(nft, {
      count: 1,
      order: "desc"
    });
    if (nftTxs.data.length === 0) {
      return null;
    }
    return this.getV1PoolInTx({ txHash: nftTxs.data[0].tx_hash });
  }
  async getV1Pools({
    cursor,
    count = 100,
    order = "asc"
  }) {
    const utxosResponse = await this.maestroClient.addresses.utxosByPaymentCred(
      DexV1Constant.POOL_SCRIPT_HASH,
      { cursor, count, order }
    );
    const utxos = utxosResponse.data;
    return utxos.filter(
      (utxo) => isValidPoolOutput(
        utxo.address,
        this.mapMaestroAssetToValue(utxo.assets),
        utxo.datum?.hash ?? ""
      )
    ).map((utxo) => {
      invariant(
        utxo.datum?.hash,
        `expect pool to have datum hash, got ${utxo.datum?.hash}`
      );
      const txIn = { txHash: utxo.tx_hash, index: utxo.index };
      return new PoolV1.State(
        utxo.address,
        txIn,
        this.mapMaestroAssetToValue(utxo.assets),
        utxo.datum?.hash
      );
    });
  }
  async getV1PoolHistory({ cursor, count = 100, order = "desc" }, { id }) {
    const nft = `${DexV1Constant.POOL_NFT_POLICY_ID}${id}`;
    const nftTxs = await this.maestroClient.assets.assetTxs(nft, {
      cursor,
      count,
      order
    });
    const nftTxsData = nftTxs.data;
    return nftTxsData.map(
      (tx) => ({
        txHash: tx.tx_hash,
        txIndex: 0,
        // TBD if this works: Maestro Asset Txs doesn't return index
        blockHeight: tx.slot,
        time: new Date(tx.timestamp)
      })
    );
  }
  async getV1PoolPrice({
    pool,
    decimalsA,
    decimalsB
  }) {
    if (decimalsA === void 0) {
      decimalsA = await this.getAssetDecimals(pool.assetA);
    }
    if (decimalsB === void 0) {
      decimalsB = await this.getAssetDecimals(pool.assetB);
    }
    const adjustedReserveA = Big(pool.reserveA.toString()).div(
      Big(10).pow(decimalsA)
    );
    const adjustedReserveB = Big(pool.reserveB.toString()).div(
      Big(10).pow(decimalsB)
    );
    const priceAB = adjustedReserveA.div(adjustedReserveB);
    const priceBA = adjustedReserveB.div(adjustedReserveA);
    return [priceAB, priceBA];
  }
  async getAllV2Pools() {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.maestroClient.addresses.utxosByPaymentCred(
      v2Config.poolScriptHashBech32,
      {
        asset: v2Config.poolAuthenAsset
      }
    );
    let utxosData = utxos.data;
    let nextCursor = utxos.next_cursor ?? null;
    while (nextCursor) {
      const utxosResponse = await this.maestroClient.addresses.utxosByPaymentCred(
        v2Config.poolScriptHashBech32,
        {
          asset: v2Config.poolAuthenAsset,
          cursor: nextCursor
        }
      );
      utxosData = utxosData.concat(utxosResponse.data);
      nextCursor = utxosResponse.next_cursor ?? null;
    }
    const pools = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (!utxo.datum?.type) {
          throw new Error(`Cannot find datum of Pool V2, tx: ${utxo.tx_hash}`);
        }
        const pool = new PoolV2.State(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes ?? ""
        );
        pools.push(pool);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      pools,
      errors
    };
  }
  async getV2Pools({
    cursor,
    count = 100,
    order = "asc"
  }) {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.maestroClient.addresses.utxosByPaymentCred(
      v2Config.poolScriptHashBech32,
      {
        asset: v2Config.poolAuthenAsset,
        cursor,
        count,
        order
      }
    );
    const utxosData = utxos.data;
    const pools = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline") {
          throw new Error(`Cannot find datum of Pool V2, tx: ${utxo.tx_hash}`);
        }
        const pool = new PoolV2.State(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum.hash
        );
        pools.push(pool);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      pools,
      errors
    };
  }
  async getV2PoolByPair(assetA, assetB) {
    const [normalizedAssetA, normalizedAssetB] = normalizeAssets(
      Asset.toString(assetA),
      Asset.toString(assetB)
    );
    const { pools: allPools } = await this.getAllV2Pools();
    return allPools.find(
      (pool) => pool.assetA === normalizedAssetA && pool.assetB === normalizedAssetB
    ) ?? null;
  }
  async getV2PoolByLp(lpAsset) {
    const { pools: allPools } = await this.getAllV2Pools();
    return allPools.find((pool) => Asset.compare(pool.lpAsset, lpAsset) === 0) ?? null;
  }
  async getV2PoolPrice({
    pool,
    decimalsA,
    decimalsB
  }) {
    if (decimalsA === void 0) {
      decimalsA = await this.getAssetDecimals(pool.assetA);
    }
    if (decimalsB === void 0) {
      decimalsB = await this.getAssetDecimals(pool.assetB);
    }
    const adjustedReserveA = Big(pool.reserveA.toString()).div(
      Big(10).pow(decimalsA)
    );
    const adjustedReserveB = Big(pool.reserveB.toString()).div(
      Big(10).pow(decimalsB)
    );
    const priceAB = adjustedReserveA.div(adjustedReserveB);
    const priceBA = adjustedReserveB.div(adjustedReserveA);
    return [priceAB, priceBA];
  }
  async getAllFactoriesV2() {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxosData = await this.getAllUtxosDataByPaymentCred(
      v2Config.factoryScriptHashBech32,
      {
        asset: v2Config.factoryAsset
      }
    );
    const factories = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline" || !utxo.datum?.bytes) {
          throw new Error(
            `Cannot find datum of Factory V2, tx: ${utxo.tx_hash}`
          );
        }
        const factory = new FactoryV2.State(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes
        );
        factories.push(factory);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      factories,
      errors
    };
  }
  async getFactoryV2ByPair(assetA, assetB) {
    const factoryIdent = PoolV2.computeLPAssetName(assetA, assetB);
    const { factories: allFactories } = await this.getAllFactoriesV2();
    for (const factory of allFactories) {
      if (StringUtils.compare(factory.head, factoryIdent) < 0 && StringUtils.compare(factoryIdent, factory.tail) < 0) {
        return factory;
      }
    }
    return null;
  }
  async getAllV2Orders() {
    const v2Config = DexV2Constant.CONFIG[this.networkId];
    const utxos = await this.maestroClient.addresses.utxosByAddress(
      v2Config.orderScriptHashBech32
    );
    const utxosData = utxos.data;
    const orders = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        let order = void 0;
        if (utxo.datum?.type === "inline") {
          order = new OrderV2.State(
            this.networkId,
            utxo.address,
            { txHash: utxo.tx_hash, index: utxo.index },
            this.mapMaestroAssetToValue(utxo.assets),
            utxo.datum.hash
          );
        } else if (utxo.datum?.hash !== null) {
          const orderDatumHash = utxo.datum?.hash ?? "";
          const orderDatum = await this.maestroClient.datum.lookupDatum(orderDatumHash);
          order = new OrderV2.State(
            this.networkId,
            utxo.address,
            { txHash: utxo.tx_hash, index: utxo.index },
            this.mapMaestroAssetToValue(utxo.assets),
            orderDatum.data.bytes
          );
        }
        if (order === void 0) {
          throw new Error(`Cannot find datum of Order V2, tx: ${utxo.tx_hash}`);
        }
        orders.push(order);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      orders,
      errors
    };
  }
  async parseStablePoolState(utxo) {
    let datum;
    if (utxo.datum?.type) {
      datum = utxo.datum.bytes ?? "";
    } else if (utxo.datum?.hash) {
      datum = await this.getDatumByDatumHash(utxo.datum.hash);
    } else {
      throw new Error("Cannot find datum of Stable Pool");
    }
    const pool = new StablePool.State(
      this.networkId,
      utxo.address,
      { txHash: utxo.tx_hash, index: utxo.index },
      this.mapMaestroAssetToValue(utxo.assets),
      datum
    );
    return pool;
  }
  async getAllStablePools() {
    const poolAddresses = StableswapConstant.CONFIG[this.networkId].map(
      (cfg) => cfg.poolAddress
    );
    const pools = [];
    const errors = [];
    for (const poolAddr of poolAddresses) {
      const utxos = await this.maestroClient.addresses.utxosByAddress(poolAddr);
      const utxosData = utxos.data;
      try {
        for (const utxo of utxosData) {
          const pool = await this.parseStablePoolState(utxo);
          pools.push(pool);
        }
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      pools,
      errors
    };
  }
  async getStablePoolByLpAsset(lpAsset) {
    const config = StableswapConstant.CONFIG[this.networkId].find(
      (cfg) => cfg.lpAsset === Asset.toString(lpAsset)
    );
    invariant(
      config,
      `getStablePoolByLpAsset: Can not find stableswap config by LP Asset ${Asset.toString(
        lpAsset
      )}`
    );
    const utxos = await this.maestroClient.addresses.utxosByAddress(
      config.poolAddress,
      {
        asset: config.nftAsset
      }
    );
    const utxosData = utxos.data;
    if (utxosData.length === 1) {
      const poolUtxo = utxosData[0];
      return await this.parseStablePoolState(poolUtxo);
    }
    return null;
  }
  async getStablePoolByNFT(nft) {
    const poolAddress = StableswapConstant.CONFIG[this.networkId].find(
      (cfg) => cfg.nftAsset === Asset.toString(nft)
    )?.poolAddress;
    if (!poolAddress) {
      throw new Error(
        `Cannot find Stable Pool having NFT ${Asset.toString(nft)}`
      );
    }
    const utxos = await this.maestroClient.addresses.utxosByAddress(
      poolAddress,
      {
        asset: Asset.toString(nft)
      }
    );
    const utxosData = utxos.data;
    if (utxosData.length === 1) {
      const poolUtxo = utxosData[0];
      return await this.parseStablePoolState(poolUtxo);
    }
    return null;
  }
  getStablePoolPrice({
    pool,
    assetAIndex,
    assetBIndex
  }) {
    const config = pool.config;
    const [priceNum, priceDen] = StableswapCalculation.getPrice(
      pool.datum.balances,
      config.multiples,
      pool.amp,
      assetAIndex,
      assetBIndex
    );
    return Big(priceNum.toString()).div(priceDen.toString());
  }
  // MARK: LBE V2
  async getAllLbeV2Factories() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxosData = await this.getAllUtxosDataByPaymentCred(
      config.factoryHashBech32,
      {
        asset: config.factoryAsset
      }
    );
    const factories = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline" || !utxo.datum?.bytes) {
          throw new Error(
            `Cannot find datum of LBE V2 Factory, tx: ${utxo.tx_hash}`
          );
        }
        const factory = new LbeV2Types.FactoryState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes
        );
        factories.push(factory);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      factories,
      errors
    };
  }
  async getLbeV2Factory(baseAsset, raiseAsset) {
    const factoryIdent = PoolV2.computeLPAssetName(baseAsset, raiseAsset);
    const { factories: allFactories } = await this.getAllLbeV2Factories();
    for (const factory of allFactories) {
      if (StringUtils.compare(factory.head, factoryIdent) < 0 && StringUtils.compare(factoryIdent, factory.tail) < 0) {
        return factory;
      }
    }
    return null;
  }
  async getLbeV2HeadAndTailFactory(lbeId) {
    const { factories: allFactories } = await this.getAllLbeV2Factories();
    let head = void 0;
    let tail = void 0;
    for (const factory of allFactories) {
      if (factory.head === lbeId) {
        tail = factory;
      }
      if (factory.tail === lbeId) {
        head = factory;
      }
    }
    if (head === void 0 || tail === void 0) {
      return null;
    }
    return { head, tail };
  }
  async getAllLbeV2Treasuries() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxosData = await this.getAllUtxosDataByPaymentCred(
      config.treasuryHashBech32,
      {
        asset: config.treasuryAsset
      }
    );
    const treasuries = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline" || !utxo.datum?.bytes) {
          throw new Error(
            `Cannot find datum of LBE V2 Treasury, tx: ${utxo.tx_hash}`
          );
        }
        const treasury = new LbeV2Types.TreasuryState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes
        );
        treasuries.push(treasury);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      treasuries,
      errors
    };
  }
  async getLbeV2TreasuryByLbeId(lbeId) {
    const { treasuries: allTreasuries } = await this.getAllLbeV2Treasuries();
    for (const treasury of allTreasuries) {
      if (treasury.lbeId === lbeId) {
        return treasury;
      }
    }
    return null;
  }
  async getAllLbeV2Managers() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxosData = await this.getAllUtxosDataByPaymentCred(
      config.managerHashBech32,
      {
        asset: config.managerAsset
      }
    );
    const managers = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline" || !utxo.datum?.bytes) {
          throw new Error(
            `Cannot find datum of Lbe V2 Manager, tx: ${utxo.tx_hash}`
          );
        }
        const manager = new LbeV2Types.ManagerState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes
        );
        managers.push(manager);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      managers,
      errors
    };
  }
  async getLbeV2ManagerByLbeId(lbeId) {
    const { managers } = await this.getAllLbeV2Managers();
    for (const manager of managers) {
      if (manager.lbeId === lbeId) {
        return manager;
      }
    }
    return null;
  }
  async getAllLbeV2Sellers() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxosData = await this.getAllUtxosDataByPaymentCred(
      config.sellerHashBech32,
      {
        asset: config.sellerAsset
      }
    );
    const sellers = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline" || !utxo.datum?.bytes) {
          throw new Error(
            `Cannot find datum of Lbe V2 Seller, tx: ${utxo.tx_hash}`
          );
        }
        const seller = new LbeV2Types.SellerState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes
        );
        sellers.push(seller);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      sellers,
      errors
    };
  }
  async getLbeV2SellerByLbeId(lbeId) {
    const { sellers } = await this.getAllLbeV2Sellers();
    for (const seller of sellers) {
      if (seller.lbeId === lbeId) {
        return seller;
      }
    }
    return null;
  }
  async getAllLbeV2Orders() {
    const config = LbeV2Constant.CONFIG[this.networkId];
    const utxosData = await this.getAllUtxosDataByPaymentCred(
      config.orderHashBech32,
      {
        asset: config.orderAsset
      }
    );
    const orders = [];
    const errors = [];
    for (const utxo of utxosData) {
      try {
        if (utxo.datum?.type != "inline" || !utxo.datum?.bytes) {
          throw new Error(
            `Cannot find datum of Lbe V2 Order, tx: ${utxo.tx_hash}`
          );
        }
        const order = new LbeV2Types.OrderState(
          this.networkId,
          utxo.address,
          { txHash: utxo.tx_hash, index: utxo.index },
          this.mapMaestroAssetToValue(utxo.assets),
          utxo.datum?.bytes
        );
        orders.push(order);
      } catch (err) {
        errors.push(err);
      }
    }
    return {
      orders,
      errors
    };
  }
  async getLbeV2OrdersByLbeId(lbeId) {
    const { orders: allOrders } = await this.getAllLbeV2Orders();
    const orders = [];
    for (const order of allOrders) {
      if (order.lbeId === lbeId) {
        orders.push(order);
      }
    }
    return orders;
  }
  async getLbeV2OrdersByLbeIdAndOwner(lbeId, owner) {
    const { orders: allOrders } = await this.getAllLbeV2Orders();
    const orders = [];
    for (const order of allOrders) {
      if (order.lbeId === lbeId && order.owner === owner) {
        orders.push(order);
      }
    }
    return orders;
  }
}

function networkEnvToLucidNetwork(networkEnv) {
  switch (networkEnv) {
    case NetworkEnvironment.MAINNET: {
      return "Mainnet";
    }
    case NetworkEnvironment.TESTNET_PREPROD: {
      return "Preprod";
    }
    case NetworkEnvironment.TESTNET_PREVIEW: {
      return "Preview";
    }
  }
}
const SLOT_CONFIG_NETWORK = {
  "Mainnet": { zeroTime: 1596059091e3, zeroSlot: 4492800, slotLength: 1e3 },
  // Starting at Shelley era
  "Preview": { zeroTime: 1666656e6, zeroSlot: 0, slotLength: 1e3 },
  // Starting at Shelley era
  "Preprod": {
    zeroTime: 16540416e5 + 1728e6,
    zeroSlot: 86400,
    slotLength: 1e3
  },
  // Starting at Shelley era
  /** Customizable slot config (Initialized with 0 values). */
  "Custom": { zeroTime: 0, zeroSlot: 0, slotLength: 0 }
};
function slotToBeginUnixTime(slot, network) {
  let slotConfig;
  if (network === "Mainnet" || network === "Preview" || network === "Preprod") {
    slotConfig = SLOT_CONFIG_NETWORK[network];
  } else {
    slotConfig = SLOT_CONFIG_NETWORK["Custom"];
  }
  const msAfterBegin = (slot - slotConfig.zeroSlot) * slotConfig.slotLength;
  return slotConfig.zeroTime + msAfterBegin;
}

var __defProp$7 = Object.defineProperty;
var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$7 = (obj, key, value) => __defNormalProp$7(obj, typeof key !== "symbol" ? key + "" : key, value);
class MinswapAdapter extends BlockfrostAdapter {
  constructor({
    networkId,
    networkEnv,
    blockFrostApi,
    repository
  }) {
    super(networkId, blockFrostApi);
    __publicField$7(this, "networkEnv");
    __publicField$7(this, "repository");
    this.networkEnv = networkEnv;
    this.repository = repository;
  }
  prismaPoolV1ToPoolV1State(prismaPool) {
    const address = prismaPool.pool_address;
    const txIn = {
      txHash: prismaPool.created_tx_id,
      index: prismaPool.created_tx_index
    };
    const value = JSONBig({
      alwaysParseAsBig: true,
      useNativeBigInt: true
    }).parse(prismaPool.value);
    const datumHash = Hasher.hashData(prismaPool.raw_datum);
    return new PoolV1.State(address, txIn, value, datumHash);
  }
  async getV1PoolInTx({
    txHash
  }) {
    const prismaPool = await this.repository.getPoolV1ByCreatedTxId(txHash);
    if (!prismaPool) {
      return null;
    }
    return this.prismaPoolV1ToPoolV1State(prismaPool);
  }
  async getV1PoolById({
    id
  }) {
    const lpAsset = `${DexV1Constant.LP_POLICY_ID}${id}`;
    const prismaPool = await this.repository.getPoolV1ByLpAsset(lpAsset);
    if (!prismaPool) {
      return null;
    }
    return this.prismaPoolV1ToPoolV1State(prismaPool);
  }
  async getV1Pools({
    page = 1,
    count = 100,
    order = "asc"
  }) {
    const prismaPools = await this.repository.getLastPoolV1State(
      page - 1,
      count,
      order
    );
    if (prismaPools.length === 0) {
      return [];
    }
    return prismaPools.map(this.prismaPoolV1ToPoolV1State);
  }
  async getV1PoolHistory({ page = 1, count = 100, order = "desc" }, { id }) {
    const lpAsset = `${DexV1Constant.LP_POLICY_ID}${id}`;
    const prismaPools = await this.repository.getHistoricalPoolV1ByLpAsset(
      lpAsset,
      page - 1,
      count,
      order
    );
    if (prismaPools.length === 0) {
      return [];
    }
    const network = networkEnvToLucidNetwork(this.networkEnv);
    return prismaPools.map(
      (prismaPool) => ({
        txHash: prismaPool.created_tx_id,
        txIndex: prismaPool.created_tx_index,
        blockHeight: Number(prismaPool.block_id),
        time: new Date(
          slotToBeginUnixTime(
            Number(prismaPool.slot),
            network
          )
        )
      })
    );
  }
  prismaPoolV2ToPoolV2State(prismaPool) {
    const txIn = {
      txHash: prismaPool.created_tx_id,
      index: prismaPool.created_tx_index
    };
    const value = JSONBig({
      alwaysParseAsBig: true,
      useNativeBigInt: true
    }).parse(prismaPool.value);
    return new PoolV2.State(
      this.networkId,
      prismaPool.pool_address,
      txIn,
      value,
      prismaPool.raw_datum
    );
  }
  async getAllV2Pools() {
    const prismaPools = await this.repository.getAllLastPoolV2State();
    return {
      pools: prismaPools.map((pool) => this.prismaPoolV2ToPoolV2State(pool)),
      errors: []
    };
  }
  async getV2Pools({
    page = 1,
    count = 100,
    order = "asc"
  }) {
    const prismaPools = await this.repository.getLastPoolV2State(
      page - 1,
      count,
      order
    );
    return {
      pools: prismaPools.map((pool) => this.prismaPoolV2ToPoolV2State(pool)),
      errors: []
    };
  }
  async getV2PoolByPair(assetA, assetB) {
    const prismaPool = await this.repository.getPoolV2ByPair(assetA, assetB);
    if (!prismaPool) {
      return null;
    }
    return this.prismaPoolV2ToPoolV2State(prismaPool);
  }
  async getV2PoolByLp(lpAsset) {
    const prismaPool = await this.repository.getPoolV2ByLpAsset(lpAsset);
    if (!prismaPool) {
      return null;
    }
    return this.prismaPoolV2ToPoolV2State(prismaPool);
  }
  async getV2PoolHistory({ page = 1, count = 100, order = "desc" }, params) {
    let lpAsset;
    if ("lpAsset" in params) {
      lpAsset = Asset.toString(params.lpAsset);
    } else {
      lpAsset = PoolV2.computeLPAssetName(params.assetA, params.assetB);
    }
    const prismaPools = await this.repository.getHistoricalPoolV2ByLpAsset(
      lpAsset,
      page - 1,
      count,
      order
    );
    if (prismaPools.length === 0) {
      return [];
    }
    return prismaPools.map((pool) => this.prismaPoolV2ToPoolV2State(pool));
  }
  prismaStablePoolToStablePoolState(prismaPool) {
    const txIn = {
      txHash: prismaPool.created_tx_id,
      index: prismaPool.created_tx_index
    };
    const value = JSONBig({
      alwaysParseAsBig: true,
      useNativeBigInt: true
    }).parse(prismaPool.value);
    return new StablePool.State(
      this.networkId,
      prismaPool.pool_address,
      txIn,
      value,
      prismaPool.raw_datum
    );
  }
  async getAllStablePools() {
    const prismaPools = await this.repository.getAllLastStablePoolState();
    return {
      pools: prismaPools.map(
        (pool) => this.prismaStablePoolToStablePoolState(pool)
      ),
      errors: []
    };
  }
  async getStablePoolByNFT(nft) {
    const config = StableswapConstant.CONFIG[this.networkId].find(
      (cfg) => cfg.nftAsset === Asset.toString(nft)
    );
    if (!config) {
      throw new Error(
        `Cannot find Stable Pool having NFT ${Asset.toString(nft)}`
      );
    }
    const prismaStablePool = await this.repository.getStablePoolByLpAsset(
      config.lpAsset
    );
    if (!prismaStablePool) {
      return null;
    }
    return this.prismaStablePoolToStablePoolState(prismaStablePool);
  }
  async getStablePoolByLpAsset(lpAsset) {
    const config = StableswapConstant.CONFIG[this.networkId].find(
      (cfg) => cfg.lpAsset === Asset.toString(lpAsset)
    );
    if (!config) {
      throw new Error(
        `Cannot find Stable Pool having NFT ${Asset.toString(lpAsset)}`
      );
    }
    const prismaStablePool = await this.repository.getStablePoolByLpAsset(
      config.lpAsset
    );
    if (!prismaStablePool) {
      return null;
    }
    return this.prismaStablePoolToStablePoolState(prismaStablePool);
  }
  async getStablePoolHistory({ page = 1, count = 100, order = "desc" }, { lpAsset }) {
    const prismaPools = await this.repository.getHistoricalStablePoolsByLpAsset(
      Asset.toString(lpAsset),
      page - 1,
      count,
      order
    );
    if (prismaPools.length === 0) {
      return [];
    }
    return prismaPools.map(
      (pool) => this.prismaStablePoolToStablePoolState(pool)
    );
  }
}

var __defProp$6 = Object.defineProperty;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$6 = (obj, key, value) => __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
class Dao {
  constructor(lucid) {
    __publicField$6(this, "lucid");
    __publicField$6(this, "networkId");
    this.lucid = lucid;
    this.networkId = lucid.network === "Mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET;
  }
  /**
   * Creates a transaction to update the trading fees for a liquidity pool.
   * This method builds a transaction with metadata that requests fee changes for a pool.
   * The transaction must be signed by the pool manager address.
   */
  async updatePoolFeeTx(options) {
    const { managerAddress, poolLPAsset, newFeeA, newFeeB } = options;
    const newFeeABps = BigInt(Math.floor(newFeeA * 100));
    const newFeeBBps = BigInt(Math.floor(newFeeB * 100));
    invariant(
      newFeeABps >= DexV2Constant.MIN_TRADING_FEE && newFeeABps <= DexV2Constant.MAX_TRADING_FEE,
      `Liquidity Pool Fee A must be in 0.05% - 20%, actual: ${newFeeA}%`
    );
    invariant(
      newFeeBBps >= DexV2Constant.MIN_TRADING_FEE && newFeeBBps <= DexV2Constant.MAX_TRADING_FEE,
      `Liquidity Pool Fee B must be in 0.05% - 20%, actual: ${newFeeB}%`
    );
    const v2Configs = DexV2Constant.CONFIG[this.networkId];
    invariant(
      poolLPAsset.policyId === v2Configs.lpPolicyId,
      `invalid Pool LP Token ${poolLPAsset}`
    );
    const feeRequestJSON = JSONBig.stringify({
      managerAddress,
      poolLPAsset: Asset.toDottedString(poolLPAsset),
      newFeeA: newFeeABps.toString(),
      newFeeB: newFeeBBps.toString(),
      version: "1"
    }).match(/.{1,64}/g);
    const paymentCred = Addresses.addressToCredential(managerAddress);
    invariant(
      paymentCred.type === "Key",
      "Manager address must be a key address"
    );
    return this.lucid.newTx().addSigner(paymentCred.hash).attachMetadata(674, {
      msg: [MetadataMessage.DAO_POOL_FEE_UPDATE],
      extraData: feeRequestJSON
    }).commit();
  }
}

const BATCHER_FEE_DEX_V1 = {
  [OrderV1.StepType.SWAP_EXACT_IN]: 2000000n,
  [OrderV1.StepType.SWAP_EXACT_OUT]: 2000000n,
  [OrderV1.StepType.DEPOSIT]: 2000000n,
  [OrderV1.StepType.WITHDRAW]: 2000000n,
  [OrderV1.StepType.ZAP_IN]: 2000000n
};
const BATCHER_FEE_STABLESWAP = {
  [StableOrder.StepType.SWAP]: 2000000n,
  [StableOrder.StepType.DEPOSIT]: 2000000n,
  [StableOrder.StepType.WITHDRAW]: 2000000n,
  [StableOrder.StepType.WITHDRAW_IMBALANCE]: 2000000n,
  [StableOrder.StepType.ZAP_OUT]: 2000000n
};
const BATCHER_FEE_DEX_V2 = {
  [OrderV2.StepType.SWAP_EXACT_IN]: 2000000n,
  [OrderV2.StepType.STOP]: 2000000n,
  [OrderV2.StepType.OCO]: 2000000n,
  [OrderV2.StepType.SWAP_EXACT_OUT]: 2000000n,
  [OrderV2.StepType.DEPOSIT]: 2000000n,
  [OrderV2.StepType.WITHDRAW]: 2000000n,
  [OrderV2.StepType.ZAP_OUT]: 2000000n,
  [OrderV2.StepType.PARTIAL_SWAP]: 2000000n,
  [OrderV2.StepType.WITHDRAW_IMBALANCE]: 2000000n,
  [OrderV2.StepType.SWAP_ROUTING]: 2000000n,
  [OrderV2.StepType.DONATION]: 2000000n
};

function buildUtxoToStoreDatum(sender, receiver, datum) {
  const receivePaymentCred = Addresses.inspect(receiver).payment;
  if (!receivePaymentCred || receivePaymentCred.type === "Key") {
    return null;
  }
  return {
    address: sender,
    assets: {},
    outputData: {
      Inline: datum
    }
  };
}

var __defProp$5 = Object.defineProperty;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$5 = (obj, key, value) => __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
class Dex {
  constructor(lucid) {
    __publicField$5(this, "lucid");
    __publicField$5(this, "networkId");
    this.lucid = lucid;
    this.networkId = lucid.network === "Mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET;
  }
  async buildSwapExactInTx(options) {
    const {
      sender,
      customReceiver,
      assetIn,
      amountIn,
      assetOut,
      minimumAmountOut,
      isLimitOrder
    } = options;
    invariant(amountIn > 0n, "amount in must be positive");
    invariant(minimumAmountOut > 0n, "minimum amount out must be positive");
    const orderAssets = { [Asset.toString(assetIn)]: amountIn };
    const batcherFee = BATCHER_FEE_DEX_V1[OrderV1.StepType.SWAP_EXACT_IN];
    if (orderAssets["lovelace"]) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA + batcherFee;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA + batcherFee;
    }
    const datum = {
      sender,
      receiver: customReceiver ? customReceiver.receiver : sender,
      receiverDatumHash: customReceiver?.receiverDatum?.hash,
      step: {
        type: OrderV1.StepType.SWAP_EXACT_IN,
        desiredAsset: assetOut,
        minimumReceived: minimumAmountOut
      },
      batcherFee,
      depositADA: FIXED_DEPOSIT_ADA
    };
    const tx = this.lucid.newTx().payToContract(
      DexV1Constant.ORDER_BASE_ADDRESS[this.networkId],
      DataObject.to(OrderV1.Datum.toPlutusData(datum)),
      orderAssets
    ).addSigner(Addresses.addressToCredential(sender).hash);
    if (isLimitOrder) {
      tx.attachMetadata(674, {
        msg: [MetadataMessage.SWAP_EXACT_IN_LIMIT_ORDER]
      });
    } else {
      tx.attachMetadata(674, { msg: [MetadataMessage.SWAP_EXACT_IN_ORDER] });
    }
    if (customReceiver && customReceiver.receiverDatum) {
      const utxoForStoringDatum = buildUtxoToStoreDatum(
        sender,
        customReceiver.receiver,
        customReceiver.receiverDatum.datum
      );
      if (utxoForStoringDatum) {
        tx.payToWithData(
          utxoForStoringDatum.address,
          utxoForStoringDatum.outputData,
          utxoForStoringDatum.assets
        );
      }
    }
    return await tx.commit();
  }
  async buildSwapExactOutTx(options) {
    const {
      sender,
      customReceiver,
      assetIn,
      assetOut,
      maximumAmountIn,
      expectedAmountOut
    } = options;
    invariant(
      maximumAmountIn > 0n && expectedAmountOut > 0n,
      "amount in and out must be positive"
    );
    const orderAssets = { [Asset.toString(assetIn)]: maximumAmountIn };
    const batcherFee = BATCHER_FEE_DEX_V1[OrderV1.StepType.SWAP_EXACT_OUT];
    if (orderAssets["lovelace"]) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA + batcherFee;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA + batcherFee;
    }
    const datum = {
      sender,
      receiver: customReceiver ? customReceiver.receiver : sender,
      receiverDatumHash: customReceiver?.receiverDatum?.hash,
      step: {
        type: OrderV1.StepType.SWAP_EXACT_OUT,
        desiredAsset: assetOut,
        expectedReceived: expectedAmountOut
      },
      batcherFee,
      depositADA: FIXED_DEPOSIT_ADA
    };
    const tx = this.lucid.newTx().payToContract(
      DexV1Constant.ORDER_BASE_ADDRESS[this.networkId],
      DataObject.to(OrderV1.Datum.toPlutusData(datum)),
      orderAssets
    ).addSigner(Addresses.addressToCredential(sender).hash).attachMetadata(674, { msg: [MetadataMessage.SWAP_EXACT_OUT_ORDER] });
    if (customReceiver && customReceiver.receiverDatum) {
      const utxoForStoringDatum = buildUtxoToStoreDatum(
        sender,
        customReceiver.receiver,
        customReceiver.receiverDatum.datum
      );
      if (utxoForStoringDatum) {
        tx.payToWithData(
          utxoForStoringDatum.address,
          utxoForStoringDatum.outputData,
          utxoForStoringDatum.assets
        );
      }
    }
    return await tx.commit();
  }
  async buildWithdrawTx(options) {
    const {
      sender,
      lpAsset,
      lpAmount,
      minimumAssetAReceived,
      minimumAssetBReceived
    } = options;
    invariant(lpAmount > 0n, "LP amount must be positive");
    invariant(
      minimumAssetAReceived > 0n && minimumAssetBReceived > 0n,
      "minimum asset received must be positive"
    );
    const orderAssets = { [Asset.toString(lpAsset)]: lpAmount };
    const batcherFee = BATCHER_FEE_DEX_V1[OrderV1.StepType.WITHDRAW];
    if (orderAssets["lovelace"]) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA + batcherFee;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA + batcherFee;
    }
    const datum = {
      sender,
      receiver: sender,
      receiverDatumHash: void 0,
      step: {
        type: OrderV1.StepType.WITHDRAW,
        minimumAssetA: minimumAssetAReceived,
        minimumAssetB: minimumAssetBReceived
      },
      batcherFee,
      depositADA: FIXED_DEPOSIT_ADA
    };
    return await this.lucid.newTx().payToContract(
      DexV1Constant.ORDER_BASE_ADDRESS[this.networkId],
      DataObject.to(OrderV1.Datum.toPlutusData(datum)),
      orderAssets
    ).addSigner(Addresses.addressToCredential(sender).hash).attachMetadata(674, { msg: [MetadataMessage.WITHDRAW_ORDER] }).commit();
  }
  async buildZapInTx(options) {
    const { sender, assetIn, amountIn, assetOut, minimumLPReceived } = options;
    invariant(amountIn > 0n, "amount in must be positive");
    invariant(minimumLPReceived > 0n, "minimum LP received must be positive");
    const orderAssets = { [Asset.toString(assetIn)]: amountIn };
    const batcherFee = BATCHER_FEE_DEX_V1[OrderV1.StepType.ZAP_IN];
    if (orderAssets["lovelace"]) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA + batcherFee;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA + batcherFee;
    }
    const datum = {
      sender,
      receiver: sender,
      receiverDatumHash: void 0,
      step: {
        type: OrderV1.StepType.ZAP_IN,
        desiredAsset: assetOut,
        minimumLP: minimumLPReceived
      },
      batcherFee,
      depositADA: FIXED_DEPOSIT_ADA
    };
    return await this.lucid.newTx().payToContract(
      DexV1Constant.ORDER_BASE_ADDRESS[this.networkId],
      DataObject.to(OrderV1.Datum.toPlutusData(datum)),
      orderAssets
    ).addSigner(Addresses.addressToCredential(sender).hash).attachMetadata(674, { msg: [MetadataMessage.ZAP_IN_ORDER] }).commit();
  }
  async buildDepositTx(options) {
    const { sender, assetA, assetB, amountA, amountB, minimumLPReceived } = options;
    invariant(amountA > 0n && amountB > 0n, "amount must be positive");
    invariant(minimumLPReceived > 0n, "minimum LP received must be positive");
    const orderAssets = {
      [Asset.toString(assetA)]: amountA,
      [Asset.toString(assetB)]: amountB
    };
    const batcherFee = BATCHER_FEE_DEX_V1[OrderV1.StepType.DEPOSIT];
    if (orderAssets["lovelace"]) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA + batcherFee;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA + batcherFee;
    }
    const datum = {
      sender,
      receiver: sender,
      receiverDatumHash: void 0,
      step: {
        type: OrderV1.StepType.DEPOSIT,
        minimumLP: minimumLPReceived
      },
      batcherFee,
      depositADA: FIXED_DEPOSIT_ADA
    };
    return await this.lucid.newTx().payToContract(
      DexV1Constant.ORDER_BASE_ADDRESS[this.networkId],
      DataObject.to(OrderV1.Datum.toPlutusData(datum)),
      orderAssets
    ).addSigner(Addresses.addressToCredential(sender).hash).attachMetadata(674, { msg: [MetadataMessage.DEPOSIT_ORDER] }).commit();
  }
  async buildCancelOrder(options) {
    const { orderUtxo } = options;
    const redeemer = DataObject.to(
      new Constr(OrderV1.Redeemer.CANCEL_ORDER, [])
    );
    const rawDatum = orderUtxo.datum;
    invariant(
      rawDatum,
      `Cancel Order requires Order UTxOs along with its CBOR Datum`
    );
    const orderDatum = OrderV1.Datum.fromPlutusData(
      this.networkId,
      DataObject.from(rawDatum)
    );
    return await this.lucid.newTx().collectFrom([orderUtxo], redeemer).addSigner(Addresses.addressToCredential(orderDatum.sender).hash).attachScript(DexV1Constant.ORDER_SCRIPT).attachMetadata(674, { msg: [MetadataMessage.CANCEL_ORDER] }).commit();
  }
}

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
class DexV2 {
  constructor(lucid, adapter) {
    __publicField$4(this, "lucid");
    __publicField$4(this, "networkId");
    __publicField$4(this, "adapter");
    this.lucid = lucid;
    this.networkId = lucid.network === "Mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET;
    this.adapter = adapter;
  }
  async createPoolTx({
    assetA,
    assetB,
    amountA,
    amountB,
    tradingFeeNumerator
  }) {
    const config = DexV2Constant.CONFIG[this.networkId];
    const [sortedAssetA, sortedAssetB, sortedAmountA, sortedAmountB] = Asset.compare(assetA, assetB) < 0 ? [assetA, assetB, amountA, amountB] : [assetB, assetA, amountB, amountA];
    const factory = await this.adapter.getFactoryV2ByPair(
      sortedAssetA,
      sortedAssetB
    );
    invariant(
      factory,
      `cannot find available Factory V2 Utxo, the liquidity pool might be created before`
    );
    const initialLiquidity = DexV2Calculation.calculateInitialLiquidity({
      amountA: sortedAmountA,
      amountB: sortedAmountB
    });
    const remainingLiquidity = PoolV2.MAX_LIQUIDITY - (initialLiquidity - PoolV2.MINIMUM_LIQUIDITY);
    const lpAssetName = PoolV2.computeLPAssetName(sortedAssetA, sortedAssetB);
    const lpAsset = {
      policyId: config.lpPolicyId,
      tokenName: lpAssetName
    };
    const poolBatchingStakeCredential = Addresses.inspect(
      config.poolBatchingAddress
    )?.delegation;
    invariant(
      poolBatchingStakeCredential,
      `cannot parse Liquidity Pool batching address`
    );
    const poolDatum = {
      poolBatchingStakeCredential,
      assetA: sortedAssetA,
      assetB: sortedAssetB,
      totalLiquidity: initialLiquidity,
      reserveA: sortedAmountA,
      reserveB: sortedAmountB,
      baseFee: {
        feeANumerator: tradingFeeNumerator,
        feeBNumerator: tradingFeeNumerator
      },
      feeSharingNumerator: void 0,
      allowDynamicFee: false
    };
    const poolValue = {
      lovelace: PoolV2.DEFAULT_POOL_ADA,
      [Asset.toString(lpAsset)]: remainingLiquidity,
      [config.poolAuthenAsset]: 1n
    };
    if (poolValue[Asset.toString(sortedAssetA)]) {
      poolValue[Asset.toString(sortedAssetA)] += sortedAmountA;
    } else {
      poolValue[Asset.toString(sortedAssetA)] = sortedAmountA;
    }
    if (poolValue[Asset.toString(sortedAssetB)]) {
      poolValue[Asset.toString(sortedAssetB)] += sortedAmountB;
    } else {
      poolValue[Asset.toString(sortedAssetB)] = sortedAmountB;
    }
    const deployedScripts = DexV2Constant.DEPLOYED_SCRIPTS[this.networkId];
    const factoryRefs = await this.lucid.utxosByOutRef([
      deployedScripts.factory
    ]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for Factory Validator"
    );
    const factoryRef = factoryRefs[0];
    const authenRefs = await this.lucid.utxosByOutRef([deployedScripts.authen]);
    invariant(
      authenRefs.length === 1,
      "cannot find deployed script for Authen Minting Policy"
    );
    const authenRef = authenRefs[0];
    const factoryUtxos = await this.lucid.utxosByOutRef([
      {
        txHash: factory.txIn.txHash,
        outputIndex: factory.txIn.index
      }
    ]);
    invariant(factoryUtxos.length === 1, "cannot find Utxo of Factory");
    const factoryUtxo = factoryUtxos[0];
    const factoryRedeemer = {
      assetA: sortedAssetA,
      assetB: sortedAssetB
    };
    const newFactoryDatum1 = {
      head: factory.head,
      tail: lpAssetName
    };
    const newFactoryDatum2 = {
      head: lpAssetName,
      tail: factory.tail
    };
    return this.lucid.newTx().readFrom([factoryRef, authenRef]).collectFrom(
      [factoryUtxo],
      DataObject.to(FactoryV2.Redeemer.toPlutusData(factoryRedeemer))
    ).payToContract(
      config.poolCreationAddress,
      {
        Inline: DataObject.to(PoolV2.Datum.toPlutusData(poolDatum))
      },
      poolValue
    ).payToContract(
      config.factoryAddress,
      {
        Inline: DataObject.to(FactoryV2.Datum.toPlutusData(newFactoryDatum1))
      },
      {
        [config.factoryAsset]: 1n
      }
    ).payToContract(
      config.factoryAddress,
      {
        Inline: DataObject.to(FactoryV2.Datum.toPlutusData(newFactoryDatum2))
      },
      {
        [config.factoryAsset]: 1n
      }
    ).mint(
      {
        [Asset.toString(lpAsset)]: PoolV2.MAX_LIQUIDITY,
        [config.factoryAsset]: 1n,
        [config.poolAuthenAsset]: 1n
      },
      DataObject.to(new Constr(1, []))
    ).attachMetadata(674, { msg: [MetadataMessage.CREATE_POOL] }).commit();
  }
  buildOrderValue(options) {
    const orderAssets = {};
    switch (options.type) {
      case OrderV2.StepType.DEPOSIT: {
        const { assetA, assetB, amountA, amountB, minimumLPReceived } = options;
        invariant(
          amountA >= 0n && amountB >= 0n && amountA + amountB > 0n,
          "amount must be positive"
        );
        invariant(
          minimumLPReceived > 0n,
          "minimum LP received must be positive"
        );
        orderAssets[Asset.toString(assetA)] = amountA;
        orderAssets[Asset.toString(assetB)] = amountB;
        break;
      }
      case OrderV2.StepType.WITHDRAW: {
        const {
          lpAsset,
          lpAmount,
          minimumAssetAReceived,
          minimumAssetBReceived
        } = options;
        invariant(lpAmount > 0n, "LP amount must be positive");
        invariant(
          minimumAssetAReceived > 0n && minimumAssetBReceived > 0n,
          "minimum asset received must be positive"
        );
        orderAssets[Asset.toString(lpAsset)] = lpAmount;
        break;
      }
      case OrderV2.StepType.SWAP_EXACT_IN: {
        const { assetIn, amountIn, minimumAmountOut } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        invariant(minimumAmountOut > 0n, "minimum amount out must be positive");
        orderAssets[Asset.toString(assetIn)] = amountIn;
        break;
      }
      case OrderV2.StepType.SWAP_EXACT_OUT: {
        const { assetIn, maximumAmountIn, expectedReceived } = options;
        invariant(maximumAmountIn > 0n, "amount in must be positive");
        invariant(expectedReceived > 0n, "minimum amount out must be positive");
        orderAssets[Asset.toString(assetIn)] = maximumAmountIn;
        break;
      }
      case OrderV2.StepType.STOP: {
        const { assetIn, amountIn, stopAmount } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        invariant(stopAmount > 0n, "stop amount out must be positive");
        orderAssets[Asset.toString(assetIn)] = amountIn;
        break;
      }
      case OrderV2.StepType.OCO: {
        const { assetIn, amountIn, stopAmount, limitAmount } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        invariant(stopAmount > 0n, "stop amount out must be positive");
        invariant(limitAmount > 0n, "limit amount out must be positive");
        orderAssets[Asset.toString(assetIn)] = amountIn;
        break;
      }
      case OrderV2.StepType.ZAP_OUT: {
        const { lpAsset, lpAmount, minimumReceived } = options;
        invariant(lpAmount > 0n, "lp amount in must be positive");
        invariant(minimumReceived > 0n, "minimum amount out must be positive");
        orderAssets[Asset.toString(lpAsset)] = lpAmount;
        break;
      }
      case OrderV2.StepType.PARTIAL_SWAP: {
        const { assetIn, amountIn, expectedInOutRatio } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        const [expectedInOutRatioNumerator, expectedInOutRatioDenominator] = expectedInOutRatio;
        invariant(
          expectedInOutRatioNumerator > 0n && expectedInOutRatioDenominator > 0n,
          "expected input and output ratio must be positive"
        );
        orderAssets[Asset.toString(assetIn)] = amountIn;
        break;
      }
      case OrderV2.StepType.WITHDRAW_IMBALANCE: {
        const { lpAsset, lpAmount, ratioAssetA, ratioAssetB, minimumAssetA } = options;
        invariant(lpAmount > 0n, "LP amount must be positive");
        invariant(
          ratioAssetA > 0n && ratioAssetB > 0n && minimumAssetA > 0n,
          "minimum asset and ratio received must be positive"
        );
        orderAssets[Asset.toString(lpAsset)] = lpAmount;
        break;
      }
      case OrderV2.StepType.SWAP_ROUTING: {
        const { assetIn, amountIn } = options;
        invariant(amountIn > 0n, "Amount must be positive");
        orderAssets[Asset.toString(assetIn)] = amountIn;
        break;
      }
    }
    if ("lovelace" in orderAssets) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA;
    }
    return orderAssets;
  }
  buildOrderStep(options, finalBatcherFee) {
    switch (options.type) {
      case OrderV2.StepType.DEPOSIT: {
        const { amountA, amountB, minimumLPReceived, killOnFailed } = options;
        invariant(
          amountA >= 0n && amountB >= 0n && amountA + amountB > 0n,
          "amount must be positive"
        );
        invariant(
          minimumLPReceived > 0n,
          "minimum LP received must be positive"
        );
        const orderStep = {
          type: OrderV2.StepType.DEPOSIT,
          depositAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            depositAmountA: amountA,
            depositAmountB: amountB
          },
          minimumLP: minimumLPReceived,
          killable: killOnFailed ? OrderV2.Killable.KILL_ON_FAILED : OrderV2.Killable.PENDING_ON_FAILED
        };
        return orderStep;
      }
      case OrderV2.StepType.WITHDRAW: {
        const {
          lpAmount,
          minimumAssetAReceived,
          minimumAssetBReceived,
          killOnFailed
        } = options;
        invariant(lpAmount > 0n, "LP amount must be positive");
        invariant(
          minimumAssetAReceived > 0n && minimumAssetBReceived > 0n,
          "minimum asset received must be positive"
        );
        const orderStep = {
          type: OrderV2.StepType.WITHDRAW,
          withdrawalAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            withdrawalLPAmount: lpAmount
          },
          minimumAssetA: minimumAssetAReceived,
          minimumAssetB: minimumAssetBReceived,
          killable: killOnFailed ? OrderV2.Killable.KILL_ON_FAILED : OrderV2.Killable.PENDING_ON_FAILED
        };
        return orderStep;
      }
      case OrderV2.StepType.SWAP_EXACT_IN: {
        const { amountIn, direction, minimumAmountOut, killOnFailed } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        invariant(minimumAmountOut > 0n, "minimum amount out must be positive");
        const orderStep = {
          type: OrderV2.StepType.SWAP_EXACT_IN,
          direction,
          swapAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            swapAmount: amountIn
          },
          minimumReceived: minimumAmountOut,
          killable: killOnFailed ? OrderV2.Killable.KILL_ON_FAILED : OrderV2.Killable.PENDING_ON_FAILED
        };
        return orderStep;
      }
      case OrderV2.StepType.SWAP_EXACT_OUT: {
        const { maximumAmountIn, expectedReceived, direction, killOnFailed } = options;
        invariant(maximumAmountIn > 0n, "amount in must be positive");
        invariant(expectedReceived > 0n, "minimum amount out must be positive");
        const orderStep = {
          type: OrderV2.StepType.SWAP_EXACT_OUT,
          direction,
          maximumSwapAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            swapAmount: maximumAmountIn
          },
          expectedReceived,
          killable: killOnFailed ? OrderV2.Killable.KILL_ON_FAILED : OrderV2.Killable.PENDING_ON_FAILED
        };
        return orderStep;
      }
      case OrderV2.StepType.STOP: {
        const { amountIn, direction, stopAmount } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        invariant(stopAmount > 0n, "stop amount out must be positive");
        const orderStep = {
          type: OrderV2.StepType.STOP,
          direction,
          swapAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            swapAmount: amountIn
          },
          stopReceived: stopAmount
        };
        return orderStep;
      }
      case OrderV2.StepType.OCO: {
        const { amountIn, direction, stopAmount, limitAmount } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        invariant(stopAmount > 0n, "stop amount out must be positive");
        invariant(limitAmount > 0n, "limit amount out must be positive");
        const orderStep = {
          type: OrderV2.StepType.OCO,
          direction,
          swapAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            swapAmount: amountIn
          },
          stopReceived: stopAmount,
          minimumReceived: limitAmount
        };
        return orderStep;
      }
      case OrderV2.StepType.ZAP_OUT: {
        const { lpAmount, minimumReceived, direction, killOnFailed } = options;
        invariant(lpAmount > 0n, "lp amount in must be positive");
        invariant(minimumReceived > 0n, "minimum amount out must be positive");
        const orderStep = {
          type: OrderV2.StepType.ZAP_OUT,
          direction,
          withdrawalAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            withdrawalLPAmount: lpAmount
          },
          minimumReceived,
          killable: killOnFailed ? OrderV2.Killable.KILL_ON_FAILED : OrderV2.Killable.PENDING_ON_FAILED
        };
        return orderStep;
      }
      case OrderV2.StepType.PARTIAL_SWAP: {
        const {
          amountIn,
          direction,
          expectedInOutRatio,
          maximumSwapTime,
          minimumSwapAmountRequired
        } = options;
        invariant(amountIn > 0n, "amount in must be positive");
        const [expectedInOutRatioNumerator, expectedInOutRatioDenominator] = expectedInOutRatio;
        invariant(
          expectedInOutRatioNumerator > 0n && expectedInOutRatioDenominator > 0n,
          "expected input and output ratio must be positive"
        );
        const orderStep = {
          type: OrderV2.StepType.PARTIAL_SWAP,
          direction,
          totalSwapAmount: amountIn,
          ioRatioNumerator: expectedInOutRatioNumerator,
          ioRatioDenominator: expectedInOutRatioDenominator,
          hops: BigInt(maximumSwapTime),
          minimumSwapAmountRequired,
          maxBatcherFeeEachTime: finalBatcherFee
        };
        return orderStep;
      }
      case OrderV2.StepType.WITHDRAW_IMBALANCE: {
        const {
          lpAmount,
          ratioAssetA,
          ratioAssetB,
          minimumAssetA,
          killOnFailed
        } = options;
        invariant(lpAmount > 0n, "LP amount must be positive");
        invariant(
          ratioAssetA > 0n && ratioAssetB > 0n && minimumAssetA > 0n,
          "minimum asset and ratio received must be positive"
        );
        const orderStep = {
          type: OrderV2.StepType.WITHDRAW_IMBALANCE,
          withdrawalAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            withdrawalLPAmount: lpAmount
          },
          ratioAssetA,
          ratioAssetB,
          minimumAssetA,
          killable: killOnFailed ? OrderV2.Killable.KILL_ON_FAILED : OrderV2.Killable.PENDING_ON_FAILED
        };
        return orderStep;
      }
      case OrderV2.StepType.SWAP_ROUTING: {
        const { amountIn, routings, minimumReceived } = options;
        invariant(amountIn > 0n, "Amount must be positive");
        const orderStep = {
          type: OrderV2.StepType.SWAP_ROUTING,
          routings,
          swapAmount: {
            type: OrderV2.AmountType.SPECIFIC_AMOUNT,
            swapAmount: amountIn
          },
          minimumReceived
        };
        return orderStep;
      }
    }
  }
  buildOrderAddress(senderAddressStakeCred) {
    const orderAddress = DexV2Constant.CONFIG[this.networkId].orderEnterpriseAddress;
    const orderAddressPaymentCred = Addresses.inspect(orderAddress).payment;
    invariant(
      orderAddressPaymentCred,
      "order address payment credentials not found"
    );
    return this.lucid.utils.credentialToAddress(
      orderAddressPaymentCred,
      senderAddressStakeCred
    );
  }
  getOrderMetadata(orderOption) {
    switch (orderOption.type) {
      case OrderV2.StepType.SWAP_EXACT_IN: {
        if (orderOption.isLimitOrder) {
          return MetadataMessage.SWAP_EXACT_IN_LIMIT_ORDER;
        } else {
          return MetadataMessage.SWAP_EXACT_IN_ORDER;
        }
      }
      case OrderV2.StepType.STOP: {
        return MetadataMessage.STOP_ORDER;
      }
      case OrderV2.StepType.OCO: {
        return MetadataMessage.OCO_ORDER;
      }
      case OrderV2.StepType.SWAP_EXACT_OUT: {
        return MetadataMessage.SWAP_EXACT_OUT_ORDER;
      }
      case OrderV2.StepType.DEPOSIT: {
        const isZapIn = orderOption.amountA === 0n || orderOption.amountB === 0n;
        if (isZapIn) {
          return MetadataMessage.ZAP_IN_ORDER;
        } else {
          return MetadataMessage.DEPOSIT_ORDER;
        }
      }
      case OrderV2.StepType.WITHDRAW: {
        return MetadataMessage.WITHDRAW_ORDER;
      }
      case OrderV2.StepType.ZAP_OUT: {
        return MetadataMessage.ZAP_OUT_ORDER;
      }
      case OrderV2.StepType.PARTIAL_SWAP: {
        return MetadataMessage.PARTIAL_SWAP_ORDER;
      }
      case OrderV2.StepType.WITHDRAW_IMBALANCE: {
        return MetadataMessage.WITHDRAW_ORDER;
      }
      case OrderV2.StepType.SWAP_ROUTING: {
        return MetadataMessage.ROUTING_ORDER;
      }
    }
  }
  async createBulkOrdersTx({
    sender,
    orderOptions,
    expiredOptions,
    composeTx,
    authorizationMethodType
  }) {
    const totalOrderAssets = {};
    for (const option of orderOptions) {
      const orderAssets = this.buildOrderValue(option);
      for (const [asset, amt] of Object.entries(orderAssets)) {
        if (asset in totalOrderAssets) {
          totalOrderAssets[asset] += amt;
        } else {
          totalOrderAssets[asset] = amt;
        }
      }
    }
    const limitOrders = [];
    const lucidTx = this.lucid.newTx();
    const necessaryExtraDatums = [];
    for (let i = 0; i < orderOptions.length; i++) {
      const option = orderOptions[i];
      const { type, lpAsset, customReceiver } = option;
      const orderAssets = this.buildOrderValue(option);
      const batcherFee = BATCHER_FEE_DEX_V2[type];
      const orderStep = this.buildOrderStep(option, batcherFee);
      if (type === OrderV2.StepType.SWAP_EXACT_IN && option.isLimitOrder) {
        limitOrders.push(i.toString());
      }
      let totalBatcherFee;
      if (type === OrderV2.StepType.PARTIAL_SWAP) {
        totalBatcherFee = batcherFee * BigInt(option.maximumSwapTime);
      } else {
        totalBatcherFee = batcherFee;
      }
      if ("lovelace" in orderAssets) {
        orderAssets["lovelace"] += totalBatcherFee;
      } else {
        orderAssets["lovelace"] = totalBatcherFee;
      }
      const senderPaymentCred = Addresses.inspect(sender).payment;
      invariant(
        senderPaymentCred,
        "sender address payment credentials not found"
      );
      const canceller = authorizationMethodType ? {
        type: authorizationMethodType,
        hash: senderPaymentCred.hash
      } : {
        type: OrderV2.AuthorizationMethodType.SIGNATURE,
        hash: senderPaymentCred.hash
      };
      let successReceiver = sender;
      let successReceiverDatum = {
        type: OrderV2.ExtraDatumType.NO_DATUM
      };
      let refundReceiver = sender;
      let refundReceiverDatum = {
        type: OrderV2.ExtraDatumType.NO_DATUM
      };
      if (customReceiver) {
        const {
          successReceiver: customSuccessReceiver,
          successReceiverDatum: customSuccessReceiverDatum,
          refundReceiver: customRefundReceiver,
          refundReceiverDatum: customRefundReceiverDatum
        } = customReceiver;
        successReceiver = customSuccessReceiver;
        refundReceiver = customRefundReceiver;
        if (!customSuccessReceiverDatum) {
          successReceiverDatum = {
            type: OrderV2.ExtraDatumType.NO_DATUM
          };
        } else {
          const datumHash = Hasher.hashData(customSuccessReceiverDatum.datum);
          successReceiverDatum = {
            type: customSuccessReceiverDatum.type,
            hash: datumHash
          };
          necessaryExtraDatums.push({
            receiver: successReceiver,
            datum: customSuccessReceiverDatum.datum
          });
        }
        if (!customRefundReceiverDatum) {
          refundReceiverDatum = {
            type: OrderV2.ExtraDatumType.NO_DATUM
          };
        } else {
          const datumHash = Hasher.hashData(customRefundReceiverDatum.datum);
          refundReceiverDatum = {
            type: customRefundReceiverDatum.type,
            hash: datumHash
          };
          necessaryExtraDatums.push({
            receiver: refundReceiver,
            datum: customRefundReceiverDatum.datum
          });
        }
      }
      const orderDatum = {
        canceller,
        refundReceiver,
        refundReceiverDatum,
        successReceiver,
        successReceiverDatum,
        step: orderStep,
        lpAsset,
        maxBatcherFee: totalBatcherFee,
        expiredOptions
      };
      let orderAddress;
      try {
        const senderStakeAddress = stakeCredentialOf(sender);
        orderAddress = this.buildOrderAddress(senderStakeAddress);
      } catch {
        orderAddress = DexV2Constant.CONFIG[this.networkId].orderEnterpriseAddress;
      }
      lucidTx.payToContract(
        orderAddress,
        {
          Inline: DataObject.to(OrderV2.Datum.toPlutusData(orderDatum))
        },
        orderAssets
      );
    }
    const metadata = orderOptions.length > 1 ? MetadataMessage.MIXED_ORDERS : this.getOrderMetadata(orderOptions[0]);
    const limitOrderMessage = limitOrders.length > 0 ? limitOrders : void 0;
    lucidTx.attachMetadata(674, {
      msg: [metadata],
      ...limitOrderMessage && { limitOrders: limitOrderMessage }
    });
    if (composeTx) {
      lucidTx.compose(composeTx);
    }
    for (const necessaryExtraDatum of necessaryExtraDatums) {
      const utxoForStoringDatum = buildUtxoToStoreDatum(
        sender,
        necessaryExtraDatum.receiver,
        necessaryExtraDatum.datum
      );
      if (utxoForStoringDatum) {
        lucidTx.payToWithData(
          utxoForStoringDatum.address,
          utxoForStoringDatum.outputData,
          utxoForStoringDatum.assets
        );
      }
    }
    return lucidTx.commit();
  }
  async cancelOrder({
    orderOutRefs,
    composeTx
  }) {
    const orderUtxos = await this.lucid.utxosByOutRef(orderOutRefs);
    if (orderUtxos.length === 0) {
      throw new Error("Order Utxos are empty");
    }
    const requiredPubKeyHashSet = /* @__PURE__ */ new Set();
    const orderRefs = await this.lucid.utxosByOutRef([
      DexV2Constant.DEPLOYED_SCRIPTS[this.networkId].order
    ]);
    invariant(
      orderRefs.length === 1,
      "cannot find deployed script for V2 Order"
    );
    const orderRef = orderRefs[0];
    const lucidTx = this.lucid.newTx().readFrom([orderRef]);
    for (const utxo of orderUtxos) {
      const orderAddr = utxo.address;
      const orderScriptPaymentCred = Addresses.inspect(orderAddr).payment;
      invariant(
        orderScriptPaymentCred?.type === "Script" && orderScriptPaymentCred.hash === DexV2Constant.CONFIG[this.networkId].orderScriptHash,
        `Utxo is not belonged Minswap's order address, utxo: ${utxo.txHash}`
      );
      let datum;
      if (utxo.datum) {
        const rawDatum = utxo.datum;
        datum = OrderV2.Datum.fromPlutusData(
          this.networkId,
          DataObject.from(rawDatum)
        );
      } else if (utxo.datumHash) {
        const rawDatum = await this.lucid.datumOf(utxo);
        datum = OrderV2.Datum.fromPlutusData(
          this.networkId,
          rawDatum
        );
      } else {
        throw new Error(
          "Utxo without Datum Hash or Inline Datum can not be spent"
        );
      }
      if (datum.canceller.type === OrderV2.AuthorizationMethodType.SIGNATURE)
        requiredPubKeyHashSet.add(datum.canceller.hash);
    }
    const redeemer = DataObject.to(
      new Constr(OrderV2.Redeemer.CANCEL_ORDER_BY_OWNER, [])
    );
    lucidTx.collectFrom(orderUtxos, redeemer);
    for (const hash of requiredPubKeyHashSet.keys()) {
      lucidTx.addSigner(hash);
    }
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.CANCEL_ORDER]
    });
    if (composeTx) {
      lucidTx.compose(composeTx);
    }
    return lucidTx.commit();
  }
  async cancelExpiredOrders({
    orderUtxos,
    currentSlot,
    availableUtxos,
    extraDatumMap
  }) {
    const refScript = await this.lucid.utxosByOutRef([
      DexV2Constant.DEPLOYED_SCRIPTS[this.networkId].order,
      DexV2Constant.DEPLOYED_SCRIPTS[this.networkId].expiredOrderCancellation
    ]);
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    invariant(
      refScript.length === 2,
      "cannot find deployed script for V2 Order or Expired Order Cancellation"
    );
    const sortedOrderUtxos = [...orderUtxos].sort(compareUtxo);
    const lucidTx = this.lucid.newTx().readFrom(refScript);
    lucidTx.collectFrom(availableUtxos);
    lucidTx.collectFrom(
      sortedOrderUtxos,
      DataObject.to(
        new Constr(OrderV2.Redeemer.CANCEL_EXPIRED_ORDER_BY_ANYONE, [])
      )
    );
    for (const orderUtxo of sortedOrderUtxos) {
      const orderAddr = orderUtxo.address;
      const orderScriptPaymentCred = Addresses.inspect(orderAddr).payment;
      invariant(
        orderScriptPaymentCred?.type === "Script" && orderScriptPaymentCred.hash === DexV2Constant.CONFIG[this.networkId].orderScriptHash,
        `Utxo is not belonged Minswap's order address, utxo: ${orderUtxo.txHash}`
      );
      let datum;
      if (orderUtxo.datum) {
        const rawDatum = orderUtxo.datum;
        datum = OrderV2.Datum.fromPlutusData(
          this.networkId,
          DataObject.from(rawDatum)
        );
      } else if (orderUtxo.datumHash) {
        const rawDatum = await this.lucid.datumOf(orderUtxo);
        datum = OrderV2.Datum.fromPlutusData(
          this.networkId,
          rawDatum
        );
      } else {
        throw new Error(
          "Utxo without Datum Hash or Inline Datum can not be spent"
        );
      }
      const expiryOptions = datum.expiredOptions;
      invariant(expiryOptions !== void 0, "Order must have expiry options");
      invariant(
        expiryOptions.maxCancellationTip >= DexV2Constant.DEFAULT_CANCEL_TIPS,
        "Cancel tip is too low"
      );
      invariant(
        expiryOptions.expiredTime < BigInt(currentTime),
        "Order is not expired"
      );
      const refundDatum = datum.refundReceiverDatum;
      const outAssets = { ...orderUtxo.assets };
      outAssets["lovelace"] -= expiryOptions.maxCancellationTip;
      switch (refundDatum.type) {
        case OrderV2.ExtraDatumType.NO_DATUM: {
          lucidTx.payTo(datum.refundReceiver, outAssets);
          break;
        }
        case OrderV2.ExtraDatumType.DATUM_HASH: {
          lucidTx.payToWithData(
            datum.refundReceiver,
            refundDatum.hash in extraDatumMap ? { AsHash: extraDatumMap[refundDatum.hash] } : { Hash: refundDatum.hash },
            outAssets
          );
          break;
        }
        case OrderV2.ExtraDatumType.INLINE_DATUM: {
          invariant(
            refundDatum.hash in extraDatumMap,
            `Can not find refund datum of order ${orderUtxo.txHash}#${orderUtxo.outputIndex}`
          );
          lucidTx.payToWithData(
            datum.refundReceiver,
            { Inline: extraDatumMap[refundDatum.hash] },
            outAssets
          );
          break;
        }
      }
    }
    lucidTx.withdraw(
      DexV2Constant.CONFIG[this.networkId].expiredOrderCancelAddress,
      0n,
      DataObject.to(0n)
    ).validFrom(currentTime).validTo(currentTime + 3 * 60 * 60 * 1e3).attachMetadata(674, {
      msg: [MetadataMessage.CANCEL_ORDERS_AUTOMATICALLY]
    });
    return await lucidTx.commit();
  }
}

async function runRecurringJob({
  name,
  job,
  interval
}) {
  while (true) {
    const startTime = Date.now();
    try {
      await job();
    } catch (err) {
      console.error(`Job ${name} fail: ${err}`);
    }
    const timeTook = Date.now() - startTime;
    console.log(`done job ${name}, took ${timeTook / 1e3}s`);
    if (timeTook < interval) {
      await sleep(interval - timeTook);
    }
  }
}
async function sleep(durationInMs) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ error: false, message: `Slept for ${durationInMs} ms` });
    }, durationInMs);
  });
}

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
class ExpiredOrderMonitor {
  constructor({
    lucid,
    blockfrostAdapter,
    privateKey
  }) {
    __publicField$3(this, "lucid");
    __publicField$3(this, "blockfrostAdapter");
    __publicField$3(this, "privateKey");
    this.lucid = lucid;
    this.blockfrostAdapter = blockfrostAdapter;
    this.privateKey = privateKey;
  }
  async start() {
    await runRecurringJob({
      name: "expired order canceller",
      interval: 1e3 * 30,
      // 30s
      job: () => this.runWorker()
    });
  }
  async runWorker() {
    console.info("starting expired order canceller");
    const { orders: allOrders } = await this.blockfrostAdapter.getAllV2Orders();
    const currentSlot = await this.blockfrostAdapter.currentSlot();
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const mapDatum = {};
    const orders = [];
    for (const order of allOrders) {
      const orderDatum = order.datum;
      const expiredOptions = orderDatum.expiredOptions;
      if (expiredOptions === void 0) {
        continue;
      }
      if (expiredOptions.expiredTime >= BigInt(currentTime)) {
        continue;
      }
      if (expiredOptions.maxCancellationTip < DexV2Constant.DEFAULT_CANCEL_TIPS) {
        continue;
      }
      const receiverDatum = orderDatum.refundReceiverDatum;
      let rawDatum = void 0;
      if (receiverDatum.type === OrderV2.ExtraDatumType.INLINE_DATUM || receiverDatum.type === OrderV2.ExtraDatumType.DATUM_HASH) {
        try {
          rawDatum = await this.blockfrostAdapter.getDatumByDatumHash(
            receiverDatum.hash
          );
          mapDatum[receiverDatum.hash] = rawDatum;
        } catch (_err) {
          if (receiverDatum.type === OrderV2.ExtraDatumType.INLINE_DATUM) {
            continue;
          }
        }
      }
      orders.push(order);
      if (orders.length === 20) {
        break;
      }
    }
    if (orders.length === 0) {
      console.info(`SKIP | No orders.`);
      return;
    }
    const orderUtxos = await this.lucid.utxosByOutRef(
      orders.map((order) => ({
        txHash: order.txIn.txHash,
        outputIndex: order.txIn.index
      }))
    );
    if (orderUtxos.length === 0) {
      console.info(`SKIP | Can not find any order utxos.`);
      return;
    }
    try {
      const credential = Crypto.privateKeyToDetails(this.privateKey).credential;
      const address = Addresses.credentialToAddress(
        this.lucid.network,
        credential
      );
      const availableUtxos = await this.lucid.utxosAt(address);
      const txComplete = await new DexV2(
        this.lucid,
        this.blockfrostAdapter
      ).cancelExpiredOrders({
        orderUtxos,
        currentSlot,
        availableUtxos,
        extraDatumMap: mapDatum
      });
      const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
      const txId = await signedTx.submit();
      console.info(`Transaction submitted successfully: ${txId}`);
    } catch (_err) {
      console.error(
        `Error when the worker runs: orders ${orders.map((order) => `${order.txIn.txHash}#${order.txIn.index}`).join(", ")}`,
        _err
      );
    }
  }
}

function validateCreateEvent(options, lucid, networkId) {
  const { lbeV2Parameters, currentSlot, factoryUtxo, projectDetails } = options;
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const { baseAsset, raiseAsset } = lbeV2Parameters;
  const datum = factoryUtxo.datum;
  invariant(datum, "Factory utxo must have inline datum");
  const factory = LbeV2Types.FactoryDatum.fromPlutusData(DataObject.from(datum));
  const config = LbeV2Constant.CONFIG[networkId];
  invariant(
    config.factoryAsset in factoryUtxo.assets,
    "Factory utxo assets must have factory asset"
  );
  const lbeV2Id = PoolV2.computeLPAssetName(baseAsset, raiseAsset);
  invariant(
    factory.head < lbeV2Id && lbeV2Id < factory.tail,
    "LBE ID name must be between factory head and tail"
  );
  validateLbeV2Parameters(lbeV2Parameters, currentTime);
  if (projectDetails !== void 0) {
    validateProjectDetails(projectDetails);
  }
}
function validateLbeV2Parameters(params, currentTime) {
  const {
    poolBaseFee,
    penaltyConfig,
    reserveBase,
    minimumRaise,
    maximumRaise,
    minimumOrderRaise,
    poolAllocation,
    startTime,
    endTime,
    baseAsset,
    raiseAsset
  } = params;
  invariant(
    Asset.toString(baseAsset) !== Asset.toString(raiseAsset),
    "Base Asset, Raise Asset must be different"
  );
  invariant(
    Asset.toString(baseAsset) !== "lovelace",
    "Base Asset must not equal ADA"
  );
  invariant(startTime >= BigInt(currentTime), "LBE must start in future");
  invariant(startTime < endTime, "StartTime < EndTime");
  invariant(
    endTime - startTime <= LbeV2Constant.MAX_DISCOVERY_RANGE,
    "Discovery Phase must in a month"
  );
  invariant(
    poolAllocation >= LbeV2Constant.MIN_POOL_ALLOCATION_POINT,
    `Pool Allocation must greater than ${LbeV2Constant.MIN_POOL_ALLOCATION_POINT}`
  );
  invariant(
    poolAllocation <= LbeV2Constant.MAX_POOL_ALLOCATION_POINT,
    `Pool Allocation must less than ${LbeV2Constant.MAX_POOL_ALLOCATION_POINT}`
  );
  if (minimumOrderRaise) {
    invariant(minimumOrderRaise > 0n, "Minimum Order > 0");
  }
  if (maximumRaise) {
    invariant(maximumRaise > 0n, "Maximum Raise > 0");
  }
  if (minimumRaise) {
    invariant(minimumRaise > 0n, "Minimum Raise > 0");
    if (maximumRaise !== void 0) {
      invariant(minimumRaise < maximumRaise, "Minimum Raise < Maximum Raise");
    }
  }
  invariant(reserveBase > 0n, "Reserve Base > 0");
  if (penaltyConfig) {
    const { penaltyStartTime, percent } = penaltyConfig;
    invariant(penaltyStartTime > startTime, "Penalty Start Time > Start Time");
    invariant(penaltyStartTime < endTime, "Penalty Start Time < End Time");
    invariant(
      penaltyStartTime >= endTime - LbeV2Constant.MAX_PENALTY_RANGE,
      "Maximum penalty period of 2 final days"
    );
    invariant(percent > 0n, "Penalty Percent > 0");
    invariant(
      percent <= LbeV2Constant.MAX_PENALTY_RATE,
      `Penalty Percent <= ${LbeV2Constant.MAX_PENALTY_RATE}`
    );
  }
  const poolBaseFeeMin = MIN_POOL_V2_TRADING_FEE_NUMERATOR;
  const poolBaseFeeMax = MAX_POOL_V2_TRADING_FEE_NUMERATOR;
  invariant(
    poolBaseFee >= poolBaseFeeMin && poolBaseFee <= poolBaseFeeMax,
    `Pool Base Fee must in range ${poolBaseFeeMin} - ${poolBaseFeeMax}`
  );
}
function validateProjectDetails(details) {
  const { eventName, description, tokenomics } = details;
  invariant(eventName.length <= 50, "Event Name is too long");
  invariant(description?.length ?? 0 < 1e3, "Event Description is too long");
  let totalPercentage = 0;
  for (const d of tokenomics ?? []) {
    invariant(d.tag.length <= 50, "tokenomic tag is too long");
    const percentage = Number(d.percentage);
    invariant(
      !isNaN(percentage) && percentage > 0 && percentage <= 100,
      "invalid percentage"
    );
    totalPercentage += percentage;
  }
  invariant(
    totalPercentage === 100 || tokenomics === void 0,
    "total percentage is not 100%"
  );
}
function validateUpdateEvent(options, lucid, networkId) {
  const { owner, treasuryUtxo, lbeV2Parameters, currentSlot, projectDetails } = options;
  const config = LbeV2Constant.CONFIG[networkId];
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const datum = treasuryUtxo.datum;
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  invariant(datum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(datum)
  );
  invariant(
    currentTime < treasuryDatum.startTime,
    "validateUpdateLbe: currentTime must be before start time"
  );
  invariant(
    treasuryDatum.isCancelled === false,
    "validateUpdateLbe: LBE is cancelled"
  );
  invariant(
    Asset.toString(treasuryDatum.baseAsset) === Asset.toString(lbeV2Parameters.baseAsset),
    "Invalid base asset"
  );
  invariant(
    Asset.toString(treasuryDatum.raiseAsset) === Asset.toString(lbeV2Parameters.raiseAsset),
    "Invalid raise asset"
  );
  invariant(owner === treasuryDatum.owner, "Invalid owner");
  validateLbeV2Parameters(lbeV2Parameters, currentTime);
  if (projectDetails !== void 0) {
    validateProjectDetails(projectDetails);
  }
}
function validateCancelEvent(options, lucid, networkId) {
  const { treasuryUtxo, cancelData, currentSlot } = options;
  const config = LbeV2Constant.CONFIG[networkId];
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const datum = treasuryUtxo.datum;
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  invariant(datum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(datum)
  );
  const {
    revocable,
    baseAsset,
    raiseAsset,
    endTime,
    startTime,
    totalLiquidity,
    minimumRaise,
    isManagerCollected,
    totalPenalty,
    reserveRaise,
    owner,
    isCancelled
  } = treasuryDatum;
  const lbeId = PoolV2.computeLPAssetName(baseAsset, raiseAsset);
  invariant(isCancelled === false, "Event already cancelled");
  switch (cancelData.reason) {
    case LbeV2Types.CancelReason.BY_OWNER: {
      invariant(
        owner === cancelData.owner,
        "validateCancelEvent: Invalid project owner"
      );
      if (revocable) {
        invariant(
          BigInt(currentTime) < endTime,
          "Cancel before discovery phase end"
        );
      } else {
        invariant(
          BigInt(currentTime) < startTime,
          "Cancel before discovery phase start"
        );
      }
      break;
    }
    case LbeV2Types.CancelReason.CREATED_POOL: {
      const ammPoolUtxo = cancelData.ammPoolUtxo;
      invariant(ammPoolUtxo.datum, "ammFactory utxo must have inline datum");
      const ammPool = PoolV2.Datum.fromPlutusData(DataObject.from(ammPoolUtxo.datum));
      invariant(
        lbeId === PoolV2.computeLPAssetName(ammPool.assetA, ammPool.assetB),
        "treasury and Amm Pool must share the same lbe id"
      );
      invariant(totalLiquidity === 0n, "LBE has created pool");
      break;
    }
    case LbeV2Types.CancelReason.NOT_REACH_MINIMUM: {
      if (minimumRaise && isManagerCollected) {
        invariant(
          reserveRaise + totalPenalty < minimumRaise,
          "Not pass minimum raise"
        );
      }
      break;
    }
  }
}
function validateDepositOrWithdrawOrder(options, lucid, networkId) {
  const {
    treasuryUtxo,
    sellerUtxo,
    existingOrderUtxos: orderUtxos,
    currentSlot,
    action
  } = options;
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  const rawSellerDatum = sellerUtxo.datum;
  invariant(rawSellerDatum, "Seller utxo must have inline datum");
  const sellerDatum = LbeV2Types.SellerDatum.fromPlutusData(
    DataObject.from(rawSellerDatum),
    networkId
  );
  invariant(
    config.sellerAsset in sellerUtxo.assets,
    "Seller utxo assets must have seller asset"
  );
  const orderDatums = orderUtxos.map((utxo) => {
    const rawOrderDatum = utxo.datum;
    invariant(rawOrderDatum, "Order utxo must have inline datum");
    invariant(
      config.orderAsset in utxo.assets,
      "Order utxo assets must have order asset"
    );
    return LbeV2Types.OrderDatum.fromPlutusData(
      DataObject.from(rawOrderDatum),
      networkId
    );
  });
  invariant(
    PoolV2.computeLPAssetName(
      treasuryDatum.baseAsset,
      treasuryDatum.raiseAsset
    ) === PoolV2.computeLPAssetName(sellerDatum.baseAsset, sellerDatum.raiseAsset),
    "treasury, seller must share the same lbe id"
  );
  let currentAmount = 0n;
  for (const orderDatum of orderDatums) {
    invariant(
      PoolV2.computeLPAssetName(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      ) === PoolV2.computeLPAssetName(orderDatum.baseAsset, orderDatum.raiseAsset),
      "treasury, order must share the same lbe id"
    );
    const ownerPaymentCredential = Addresses.inspect(
      orderDatum.owner
    ).payment;
    invariant(
      ownerPaymentCredential && ownerPaymentCredential.type === "Key",
      "Order owner must be pubkey hash"
    );
    currentAmount += orderDatum.amount;
  }
  invariant(treasuryDatum.isCancelled === false, "lbe has cancelled");
  let newAmount;
  if (action.type === "deposit") {
    newAmount = currentAmount + action.additionalAmount;
  } else {
    invariant(
      currentAmount >= action.withdrawalAmount,
      `Exceed the maximum withdrawal, withdrawal: ${action.withdrawalAmount}, available: ${currentAmount}`
    );
    newAmount = currentAmount - action.withdrawalAmount;
  }
  invariant(
    treasuryDatum.startTime <= currentTime,
    `The event hasn't really started yet, please wait a little longer.`
  );
  invariant(currentTime <= treasuryDatum.endTime, "The event has been ended!");
  const minimumRaise = treasuryDatum.minimumOrderRaise;
  if (minimumRaise !== void 0) {
    invariant(
      newAmount === 0n || newAmount >= minimumRaise,
      "Using Seller Tx: Order must higher than min raise"
    );
  }
}
function validateCloseEvent(options, networkId) {
  const { treasuryUtxo, headFactoryUtxo, tailFactoryUtxo, owner } = options;
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  const lbeId = PoolV2.computeLPAssetName(
    treasuryDatum.baseAsset,
    treasuryDatum.raiseAsset
  );
  const rawHeadFactoryDatum = headFactoryUtxo.datum;
  invariant(rawHeadFactoryDatum, "Treasury utxo must have inline datum");
  const headFactoryDatum = LbeV2Types.FactoryDatum.fromPlutusData(
    DataObject.from(rawHeadFactoryDatum)
  );
  invariant(
    config.factoryAsset in headFactoryUtxo.assets,
    "Factory utxo assets must have factory asset"
  );
  const rawTailFactoryDatum = tailFactoryUtxo.datum;
  invariant(rawTailFactoryDatum, "Treasury utxo must have inline datum");
  const tailFactoryDatum = LbeV2Types.FactoryDatum.fromPlutusData(
    DataObject.from(rawTailFactoryDatum)
  );
  invariant(
    config.factoryAsset in tailFactoryUtxo.assets,
    "Factory utxo assets must have factory asset"
  );
  invariant(headFactoryDatum.tail === lbeId, "Head Factory is invalid");
  invariant(tailFactoryDatum.head === lbeId, "Tail Factory is invalid");
  invariant(treasuryDatum.isCancelled === true, "lbe must be cancelled");
  invariant(treasuryDatum.owner === owner, "Only Owner can close");
  invariant(treasuryDatum.isManagerCollected, "Manager must be collected");
  invariant(
    treasuryDatum.totalPenalty === 0n && treasuryDatum.reserveRaise === 0n,
    "All Orders have been refunded"
  );
}
function validateAddSeller(options, lucid, networkId) {
  const { addSellerCount, treasuryUtxo, managerUtxo, currentSlot } = options;
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  const rawManagerDatum = managerUtxo.datum;
  invariant(rawManagerDatum, "Manager utxo must have inline datum");
  const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
    DataObject.from(rawManagerDatum)
  );
  invariant(
    config.managerAsset in managerUtxo.assets,
    "Manager utxo assets must have manager asset"
  );
  invariant(addSellerCount > 0, "Must add at least one seller");
  invariant(
    PoolV2.computeLPAssetName(
      treasuryDatum.baseAsset,
      treasuryDatum.raiseAsset
    ) === PoolV2.computeLPAssetName(
      managerDatum.baseAsset,
      managerDatum.raiseAsset
    ),
    "treasury, manager must have same Lbe ID"
  );
  invariant(
    currentTime < treasuryDatum.endTime,
    "Must add seller before encounter phase"
  );
}
function validateCountingSeller(options, lucid, networkId) {
  const { treasuryUtxo, managerUtxo, sellerUtxos, currentSlot } = options;
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  const rawManagerDatum = managerUtxo.datum;
  invariant(rawManagerDatum, "Manager utxo must have inline datum");
  const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
    DataObject.from(rawManagerDatum)
  );
  invariant(
    config.managerAsset in managerUtxo.assets,
    "Manager utxo assets must have manager asset"
  );
  invariant(
    PoolV2.computeLPAssetName(
      treasuryDatum.baseAsset,
      treasuryDatum.raiseAsset
    ) === PoolV2.computeLPAssetName(
      managerDatum.baseAsset,
      managerDatum.raiseAsset
    ),
    "treasury, manager must share the same lbe id"
  );
  sellerUtxos.map((utxo) => {
    const rawSellerDatum = utxo.datum;
    invariant(rawSellerDatum, "Seller utxo must have inline datum");
    invariant(
      config.sellerAsset in utxo.assets,
      "Seller utxo assets must have seller asset"
    );
    const sellerDatum = LbeV2Types.SellerDatum.fromPlutusData(
      DataObject.from(rawSellerDatum),
      networkId
    );
    invariant(
      PoolV2.computeLPAssetName(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      ) === PoolV2.computeLPAssetName(
        sellerDatum.baseAsset,
        sellerDatum.raiseAsset
      ),
      "treasury, seller must share the same lbe id"
    );
    return sellerDatum;
  });
  invariant(
    sellerUtxos.length >= LbeV2Constant.MINIMUM_SELLER_COLLECTED || BigInt(sellerUtxos.length) === managerDatum.sellerCount,
    "not collect enough sellers"
  );
  invariant(sellerUtxos.length > 0, "At least one seller input is required.");
  invariant(
    currentTime > treasuryDatum.endTime || treasuryDatum.isCancelled === true,
    "lbe is not cancel or discovery phase is not ended"
  );
}
function validateCollectManager(options, lucid, networkId) {
  const { treasuryUtxo, managerUtxo, currentSlot } = options;
  const currentTime = lucid.utils.slotsToUnixTime(currentSlot);
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  const rawManagerDatum = managerUtxo.datum;
  invariant(rawManagerDatum, "Manager utxo must have inline datum");
  const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
    DataObject.from(rawManagerDatum)
  );
  invariant(
    config.managerAsset in managerUtxo.assets,
    "Manager utxo assets must have manager asset"
  );
  invariant(
    PoolV2.computeLPAssetName(
      treasuryDatum.baseAsset,
      treasuryDatum.raiseAsset
    ) === PoolV2.computeLPAssetName(
      managerDatum.baseAsset,
      managerDatum.raiseAsset
    ),
    "treasury, manager must share the same lbe id"
  );
  invariant(
    currentTime > treasuryDatum.endTime || treasuryDatum.isCancelled === true,
    "lbe is not cancel or discovery phase is not ended"
  );
  invariant(
    managerDatum.sellerCount === 0n,
    "Must collect all seller before collecting manager"
  );
  invariant(
    treasuryDatum.isManagerCollected === false,
    "LBE collected manager yet"
  );
}
function validateCollectOrders(options, networkId) {
  const { treasuryUtxo, orderUtxos } = options;
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  let collectAmount = 0n;
  for (const orderUtxo of orderUtxos) {
    const rawOrderDatum = orderUtxo.datum;
    invariant(rawOrderDatum, "Order utxo must have inline datum");
    const orderDatum = LbeV2Types.OrderDatum.fromPlutusData(
      DataObject.from(rawOrderDatum),
      networkId
    );
    invariant(orderDatum.isCollected === false, "Order must not be collected");
    invariant(
      config.orderAsset in orderUtxo.assets,
      "Order utxo assets must have order asset"
    );
    invariant(
      PoolV2.computeLPAssetName(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      ) === PoolV2.computeLPAssetName(orderDatum.baseAsset, orderDatum.raiseAsset),
      "treasury, order must share the same lbe id"
    );
    collectAmount += orderDatum.amount + orderDatum.penaltyAmount;
  }
  const remainAmount = treasuryDatum.reserveRaise + treasuryDatum.totalPenalty - treasuryDatum.collectedFund;
  invariant(
    treasuryDatum.isManagerCollected === true,
    "LBE didn't collect manager"
  );
  invariant(
    orderUtxos.length >= LbeV2Constant.MINIMUM_ORDER_COLLECTED || collectAmount === remainAmount,
    `validateCollectOrders: not collect enough orders LBE having base asset ${treasuryDatum.baseAsset.toString()} and raise asset ${treasuryDatum.raiseAsset.toString()}`
  );
}
function validateRedeemOrders(options, networkId) {
  const { treasuryUtxo, orderUtxos } = options;
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  let redeemAmount = 0n;
  for (const orderUtxo of orderUtxos) {
    const rawOrderDatum = orderUtxo.datum;
    invariant(rawOrderDatum, "Order utxo must have inline datum");
    const orderDatum = LbeV2Types.OrderDatum.fromPlutusData(
      DataObject.from(rawOrderDatum),
      networkId
    );
    invariant(
      config.orderAsset in orderUtxo.assets,
      "Order utxo assets must have order asset"
    );
    invariant(
      PoolV2.computeLPAssetName(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      ) === PoolV2.computeLPAssetName(orderDatum.baseAsset, orderDatum.raiseAsset),
      "treasury, order must share the same lbe id"
    );
    redeemAmount += orderDatum.amount + orderDatum.penaltyAmount;
  }
  invariant(treasuryDatum.totalLiquidity > 0n, "LBE didn't create pool");
  invariant(
    orderUtxos.length >= LbeV2Constant.MINIMUM_ORDER_REDEEMED || redeemAmount === treasuryDatum.collectedFund,
    `validateCollectOrders: not collect enough orders LBE having base asset ${treasuryDatum.baseAsset.toString()} and raise asset ${treasuryDatum.raiseAsset.toString()}`
  );
}
function validateRefundOrders(options, networkId) {
  const { treasuryUtxo, orderUtxos } = options;
  const config = LbeV2Constant.CONFIG[networkId];
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  invariant(
    config.treasuryAsset in treasuryUtxo.assets,
    "Treasury utxo assets must have treasury asset"
  );
  let refundAmount = 0n;
  for (const orderUtxo of orderUtxos) {
    const rawOrderDatum = orderUtxo.datum;
    invariant(rawOrderDatum, "Order utxo must have inline datum");
    const orderDatum = LbeV2Types.OrderDatum.fromPlutusData(
      DataObject.from(rawOrderDatum),
      networkId
    );
    invariant(
      config.orderAsset in orderUtxo.assets,
      "Order utxo assets must have order asset"
    );
    invariant(
      PoolV2.computeLPAssetName(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      ) === PoolV2.computeLPAssetName(orderDatum.baseAsset, orderDatum.raiseAsset),
      "treasury, order must share the same lbe id"
    );
    refundAmount += orderDatum.amount + orderDatum.penaltyAmount;
  }
  invariant(treasuryDatum.isCancelled === true, "LBE is not cancelled");
  invariant(
    treasuryDatum.isManagerCollected === true,
    "LBE didn't collect manager"
  );
  invariant(
    orderUtxos.length >= LbeV2Constant.MINIMUM_ORDER_REDEEMED || refundAmount === treasuryDatum.collectedFund,
    `validateCollectOrders: not collect enough orders LBE having base asset ${treasuryDatum.baseAsset.toString()} and raise asset ${treasuryDatum.raiseAsset.toString()}`
  );
}
function validateCreateAmmPool(options, networkId) {
  const { treasuryUtxo, ammFactoryUtxo } = options;
  const rawTreasuryDatum = treasuryUtxo.datum;
  invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
  const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
    networkId,
    DataObject.from(rawTreasuryDatum)
  );
  const rawAmmFactoryDatum = ammFactoryUtxo.datum;
  invariant(rawAmmFactoryDatum, "Amm Factory utxo must have inline datum");
  const ammFactory = FactoryV2.Datum.fromPlutusData(
    DataObject.from(rawAmmFactoryDatum)
  );
  const {
    baseAsset,
    raiseAsset,
    isManagerCollected,
    collectedFund,
    reserveBase,
    reserveRaise,
    totalPenalty,
    isCancelled,
    minimumRaise,
    totalLiquidity
  } = treasuryDatum;
  const lpAssetName = PoolV2.computeLPAssetName(baseAsset, raiseAsset);
  invariant(
    lpAssetName > ammFactory.head && lpAssetName < ammFactory.tail,
    "Invalid factory"
  );
  invariant(
    isManagerCollected && collectedFund === reserveRaise + totalPenalty,
    "must collect all before create pool"
  );
  invariant(!isCancelled, "LBE must not be cancelled");
  invariant(collectedFund >= (minimumRaise ?? 1n), "Lbe do not raise enough");
  const initialLiquidity = DexV2Calculation.calculateInitialLiquidity({
    amountA: reserveBase,
    amountB: reserveRaise + totalPenalty
  });
  invariant(
    initialLiquidity > PoolV2.MINIMUM_LIQUIDITY,
    "Can not create pool because initialLiquidity is too low"
  );
  invariant(totalLiquidity === 0n, "Lbe creating is already success");
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
const THREE_HOUR_IN_MS = 3 * 60 * 60 * 1e3;
class LbeV2 {
  constructor(lucid) {
    __publicField$2(this, "lucid");
    __publicField$2(this, "networkId");
    this.lucid = lucid;
    this.networkId = lucid.network === "Mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET;
  }
  async createEvent(options) {
    validateCreateEvent(options, this.lucid, this.networkId);
    const { lbeV2Parameters, factoryUtxo, projectDetails, currentSlot } = options;
    const sellerCount = options.sellerCount ?? Number(LbeV2Constant.DEFAULT_SELLER_COUNT);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const deployed = LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId];
    const datum = factoryUtxo.datum;
    invariant(datum, "Factory utxo must have inline datum");
    const factory = LbeV2Types.FactoryDatum.fromPlutusData(DataObject.from(datum));
    const { baseAsset, raiseAsset, owner } = lbeV2Parameters;
    const lbeV2Id = PoolV2.computeLPAssetName(baseAsset, raiseAsset);
    const treasuryDatum = LbeV2Types.LbeV2Parameters.toLbeV2TreasuryDatum(
      this.networkId,
      lbeV2Parameters
    );
    const lucidTx = this.lucid.newTx();
    const factoryRefs = await this.lucid.utxosByOutRef([deployed.factory]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    const redeemer = {
      type: LbeV2Types.FactoryRedeemerType.CREATE_TREASURY,
      baseAsset,
      raiseAsset
    };
    lucidTx.collectFrom(
      [factoryUtxo],
      DataObject.to(
        RedeemerWrapper.toPlutusData(
          LbeV2Types.FactoryRedeemer.toPlutusData(redeemer)
        )
      )
    );
    const mintAssets = {};
    mintAssets[config.factoryAsset] = 1n;
    mintAssets[config.treasuryAsset] = 1n;
    mintAssets[config.managerAsset] = 1n;
    mintAssets[config.sellerAsset] = BigInt(sellerCount);
    lucidTx.mint(
      mintAssets,
      DataObject.to(LbeV2Types.FactoryRedeemer.toPlutusData(redeemer))
    );
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    lucidTx.validFrom(currentTime).validTo(
      Math.min(
        Number(lbeV2Parameters.startTime) - 1,
        currentTime + THREE_HOUR_IN_MS
      )
    );
    lucidTx.payToContract(
      config.factoryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.FactoryDatum.toPlutusData({
            head: factory.head,
            tail: lbeV2Id
          })
        )
      },
      {
        [config.factoryAsset]: 1n
      }
    ).payToContract(
      config.factoryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.FactoryDatum.toPlutusData({
            head: lbeV2Id,
            tail: factory.tail
          })
        )
      },
      {
        [config.factoryAsset]: 1n
      }
    ).payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(LbeV2Types.TreasuryDatum.toPlutusData(treasuryDatum))
      },
      {
        [config.treasuryAsset]: 1n,
        lovelace: LbeV2Constant.TREASURY_MIN_ADA + LbeV2Constant.CREATE_POOL_COMMISSION,
        [Asset.toString(baseAsset)]: lbeV2Parameters.reserveBase
      }
    ).payToContract(
      config.managerAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.ManagerDatum.toPlutusData({
            factoryPolicyId: config.factoryHash,
            baseAsset,
            raiseAsset,
            sellerCount: BigInt(sellerCount),
            reserveRaise: 0n,
            totalPenalty: 0n
          })
        )
      },
      {
        [config.managerAsset]: 1n,
        lovelace: LbeV2Constant.MANAGER_MIN_ADA
      }
    );
    for (let i = 0; i < sellerCount; ++i) {
      lucidTx.payToContract(
        config.sellerAddress,
        {
          Inline: DataObject.to(
            LbeV2Types.SellerDatum.toPlutusData({
              factoryPolicyId: config.factoryHash,
              owner,
              baseAsset,
              raiseAsset,
              amount: 0n,
              penaltyAmount: 0n
            })
          )
        },
        {
          [config.sellerAsset]: 1n,
          lovelace: LbeV2Constant.SELLER_MIN_ADA
        }
      );
    }
    const ownerPaymentCredential = Addresses.inspect(owner).payment;
    invariant(
      ownerPaymentCredential && ownerPaymentCredential?.type === "Key",
      "owner payment credential must be public key"
    );
    lucidTx.addSigner(Addresses.addressToCredential(owner).hash);
    const extraData = JSONBig.stringify(projectDetails).match(/.{1,64}/g);
    invariant(extraData, "cannot parse LbeV2 Project Details");
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.CREATE_EVENT],
      extraData: extraData ?? []
    });
    return lucidTx.commit();
  }
  async updateEvent(options) {
    validateUpdateEvent(options, this.lucid, this.networkId);
    const {
      owner,
      treasuryUtxo,
      lbeV2Parameters,
      currentSlot,
      projectDetails
    } = options;
    const config = LbeV2Constant.CONFIG[this.networkId];
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const datum = treasuryUtxo.datum;
    invariant(datum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(datum)
    );
    const newTreasuryDatum = LbeV2Types.LbeV2Parameters.toLbeV2TreasuryDatum(
      this.networkId,
      lbeV2Parameters
    );
    const lucidTx = this.lucid.newTx();
    const treasuryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].treasury
    ]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(treasuryRefs);
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.UPDATE_LBE
        })
      )
    );
    lucidTx.payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData(newTreasuryDatum)
        )
      },
      {
        [config.treasuryAsset]: 1n,
        lovelace: LbeV2Constant.TREASURY_MIN_ADA + LbeV2Constant.CREATE_POOL_COMMISSION,
        [Asset.toString(newTreasuryDatum.baseAsset)]: lbeV2Parameters.reserveBase
      }
    );
    lucidTx.addSigner(Addresses.addressToCredential(owner).hash);
    lucidTx.validFrom(currentTime).validTo(
      Math.min(
        Number(treasuryDatum.startTime) - 1e3,
        Number(lbeV2Parameters.startTime) - 1e3,
        currentTime + THREE_HOUR_IN_MS
      )
    );
    const extraData = projectDetails !== void 0 ? JSONBig.stringify(projectDetails).match(/.{1,64}/g) : null;
    invariant(extraData, "cannot parse LbeV2 Project Details");
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.UPDATE_EVENT],
      extraData: extraData ?? []
    });
    return await lucidTx.commit();
  }
  async cancelEvent(options) {
    validateCancelEvent(options, this.lucid, this.networkId);
    const { treasuryUtxo, cancelData, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const datum = treasuryUtxo.datum;
    invariant(datum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(datum)
    );
    const { revocable, startTime, endTime, owner } = treasuryDatum;
    const lucidTx = this.lucid.newTx();
    const treasuryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].treasury
    ]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(treasuryRefs);
    const treasuryRedeemer = {
      type: LbeV2Types.TreasuryRedeemerType.CANCEL_LBE,
      reason: cancelData.reason
    };
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(LbeV2Types.TreasuryRedeemer.toPlutusData(treasuryRedeemer))
    );
    const newTreasuryDatum = {
      ...treasuryDatum,
      isCancelled: true
    };
    lucidTx.payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData(newTreasuryDatum)
        )
      },
      treasuryUtxo.assets
    );
    let validTo = currentTime + THREE_HOUR_IN_MS;
    switch (cancelData.reason) {
      case LbeV2Types.CancelReason.BY_OWNER: {
        validTo = Math.min(
          validTo,
          Number(revocable ? endTime : startTime) - 1e3
        );
        lucidTx.addSigner(Addresses.addressToCredential(owner).hash).attachMetadata(674, {
          msg: [MetadataMessage.CANCEL_EVENT_BY_OWNER]
        });
        break;
      }
      case LbeV2Types.CancelReason.CREATED_POOL: {
        lucidTx.readFrom([cancelData.ammPoolUtxo]).attachMetadata(674, {
          msg: [MetadataMessage.CANCEL_EVENT_BY_WORKER]
        });
        break;
      }
      case LbeV2Types.CancelReason.NOT_REACH_MINIMUM: {
        lucidTx.attachMetadata(674, {
          msg: [MetadataMessage.CANCEL_EVENT_BY_WORKER]
        });
        break;
      }
    }
    lucidTx.validTo(validTo);
    return lucidTx.commit();
  }
  calculatePenaltyAmount(options) {
    const { penaltyConfig, time, totalInputAmount, totalOutputAmount } = options;
    if (penaltyConfig !== void 0) {
      const { penaltyStartTime, percent } = penaltyConfig;
      if (time < penaltyStartTime) {
        return 0n;
      }
      if (totalInputAmount > totalOutputAmount) {
        const withdrawAmount = totalInputAmount - totalOutputAmount;
        return withdrawAmount * percent / 100n;
      }
      return 0n;
    }
    return 0n;
  }
  async depositOrWithdrawOrder(options) {
    validateDepositOrWithdrawOrder(options, this.lucid, this.networkId);
    const {
      treasuryUtxo,
      sellerUtxo,
      existingOrderUtxos: orderUtxos,
      currentSlot,
      owner,
      action
    } = options;
    const config = LbeV2Constant.CONFIG[this.networkId];
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const rawSellerDatum = sellerUtxo.datum;
    invariant(rawSellerDatum, "Seller utxo must have inline datum");
    const sellerDatum = LbeV2Types.SellerDatum.fromPlutusData(
      DataObject.from(rawSellerDatum),
      this.networkId
    );
    const orderDatums = orderUtxos.map((utxo) => {
      const rawOrderDatum = utxo.datum;
      invariant(rawOrderDatum, "Factory utxo must have inline datum");
      return LbeV2Types.OrderDatum.fromPlutusData(
        DataObject.from(rawOrderDatum),
        this.networkId
      );
    });
    let currentAmount = 0n;
    let totalInputPenalty = 0n;
    for (const orderDatum of orderDatums) {
      currentAmount += orderDatum.amount;
      totalInputPenalty += orderDatum.penaltyAmount;
    }
    let newAmount;
    if (action.type === "deposit") {
      newAmount = currentAmount + action.additionalAmount;
    } else {
      newAmount = currentAmount - action.withdrawalAmount;
    }
    const validTo = Math.min(
      Number(treasuryDatum.endTime),
      currentTime + THREE_HOUR_IN_MS
    );
    const txPenaltyAmount = this.calculatePenaltyAmount({
      penaltyConfig: treasuryDatum.penaltyConfig,
      time: BigInt(validTo),
      totalInputAmount: currentAmount,
      totalOutputAmount: newAmount
    });
    const newPenaltyAmount = totalInputPenalty + txPenaltyAmount;
    const lucidTx = this.lucid.newTx();
    const sellerRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].seller
    ]);
    invariant(
      sellerRefs.length === 1,
      "cannot find deployed script for LbeV2 Seller"
    );
    lucidTx.readFrom(sellerRefs).readFrom([treasuryUtxo]);
    if (orderUtxos.length !== 0) {
      const orderRefs = await this.lucid.utxosByOutRef([
        LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].order
      ]);
      invariant(
        orderRefs.length === 1,
        "cannot find deployed script for LbeV2 Order"
      );
      lucidTx.readFrom(orderRefs);
    }
    lucidTx.collectFrom(
      [sellerUtxo],
      DataObject.to(
        LbeV2Types.SellerRedeemer.toPlutusData(
          LbeV2Types.SellerRedeemer.USING_SELLER
        )
      )
    );
    lucidTx.collectFrom(
      orderUtxos,
      DataObject.to(
        LbeV2Types.OrderRedeemer.toPlutusData(
          LbeV2Types.OrderRedeemer.UPDATE_ORDER
        )
      )
    );
    for (const orderDatum of orderDatums) {
      lucidTx.addSigner(Addresses.addressToCredential(orderDatum.owner).hash);
    }
    let orderTokenMintAmount = 0n;
    if (newAmount + newPenaltyAmount > 0n) {
      orderTokenMintAmount += 1n;
    }
    if (orderUtxos.length > 0) {
      orderTokenMintAmount -= BigInt(orderUtxos.length);
    }
    if (orderTokenMintAmount !== 0n) {
      const factoryRefs = await this.lucid.utxosByOutRef([
        LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
      ]);
      invariant(
        factoryRefs.length === 1,
        "cannot find deployed script for LbeV2 Factory"
      );
      lucidTx.readFrom(factoryRefs).mint(
        { [config.orderAsset]: orderTokenMintAmount },
        DataObject.to(
          LbeV2Types.FactoryRedeemer.toPlutusData({
            type: LbeV2Types.FactoryRedeemerType.MINT_ORDER
          })
        )
      );
    }
    const newSellerDatum = {
      ...sellerDatum,
      amount: sellerDatum.amount + newAmount - currentAmount,
      penaltyAmount: sellerDatum.penaltyAmount + txPenaltyAmount
    };
    const newSellerAssets = {
      ...sellerUtxo.assets
    };
    if (orderUtxos.length === 0 && newAmount > 0n) {
      newSellerAssets.lovelace = newSellerAssets.lovelace + LbeV2Constant.SELLER_COMMISSION;
    }
    lucidTx.payToContract(
      config.sellerAddress,
      { Inline: DataObject.to(LbeV2Types.SellerDatum.toPlutusData(newSellerDatum)) },
      newSellerAssets
    );
    if (newAmount + newPenaltyAmount > 0n) {
      const newOrderDatum = {
        factoryPolicyId: config.factoryHash,
        baseAsset: treasuryDatum.baseAsset,
        raiseAsset: treasuryDatum.raiseAsset,
        owner,
        amount: newAmount,
        isCollected: false,
        penaltyAmount: newPenaltyAmount
      };
      const orderAssets = {
        lovelace: LbeV2Constant.ORDER_MIN_ADA + LbeV2Constant.ORDER_COMMISSION * 2n,
        [config.orderAsset]: 1n
      };
      const raiseAsset = Asset.toString(treasuryDatum.raiseAsset);
      if (raiseAsset in orderAssets) {
        orderAssets[raiseAsset] += newAmount + newPenaltyAmount;
      } else {
        orderAssets[raiseAsset] = newAmount + newPenaltyAmount;
      }
      console.log(orderAssets);
      lucidTx.payToContract(
        config.orderAddress,
        { Inline: DataObject.to(LbeV2Types.OrderDatum.toPlutusData(newOrderDatum)) },
        orderAssets
      );
    }
    lucidTx.validFrom(currentTime).validTo(validTo);
    if (action.type === "deposit") {
      lucidTx.attachMetadata(674, {
        msg: [MetadataMessage.LBE_V2_DEPOSIT_ORDER_EVENT]
      });
    } else {
      lucidTx.attachMetadata(674, {
        msg: [MetadataMessage.LBE_V2_WITHDRAW_ORDER_EVENT]
      });
    }
    return lucidTx.commit();
  }
  async closeEventTx(options) {
    validateCloseEvent(options, this.networkId);
    const { treasuryUtxo, headFactoryUtxo, tailFactoryUtxo, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const rawHeadFactoryDatum = headFactoryUtxo.datum;
    invariant(rawHeadFactoryDatum, "Treasury utxo must have inline datum");
    const headFactoryDatum = LbeV2Types.FactoryDatum.fromPlutusData(
      DataObject.from(rawHeadFactoryDatum)
    );
    const rawTailFactoryDatum = tailFactoryUtxo.datum;
    invariant(rawTailFactoryDatum, "Treasury utxo must have inline datum");
    const tailFactoryDatum = LbeV2Types.FactoryDatum.fromPlutusData(
      DataObject.from(rawTailFactoryDatum)
    );
    const lucidTx = this.lucid.newTx();
    const factoryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
    ]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    const treasuryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].treasury
    ]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Treasury"
    );
    lucidTx.readFrom(treasuryRefs);
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.CLOSE_EVENT
        })
      )
    ).collectFrom(
      [headFactoryUtxo, tailFactoryUtxo],
      DataObject.to(
        RedeemerWrapper.toPlutusData(
          LbeV2Types.FactoryRedeemer.toPlutusData({
            type: LbeV2Types.FactoryRedeemerType.CLOSE_TREASURY,
            baseAsset: treasuryDatum.baseAsset,
            raiseAsset: treasuryDatum.raiseAsset
          })
        )
      )
    );
    lucidTx.mint(
      {
        [config.factoryAsset]: -1n,
        [config.treasuryAsset]: -1n
      },
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.CLOSE_TREASURY,
          baseAsset: treasuryDatum.baseAsset,
          raiseAsset: treasuryDatum.raiseAsset
        })
      )
    );
    lucidTx.payToContract(
      config.factoryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.FactoryDatum.toPlutusData({
            head: headFactoryDatum.head,
            tail: tailFactoryDatum.tail
          })
        )
      },
      {
        [config.factoryAsset]: 1n
      }
    );
    lucidTx.addSigner(Addresses.addressToCredential(treasuryDatum.owner).hash);
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.CLOSE_EVENT]
    });
    return await lucidTx.commit();
  }
  async addSellers(options) {
    validateAddSeller(options, this.lucid, this.networkId);
    const {
      treasuryUtxo,
      managerUtxo,
      addSellerCount,
      sellerOwner,
      currentSlot
    } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const rawManagerDatum = managerUtxo.datum;
    invariant(rawManagerDatum, "Treasury utxo must have inline datum");
    const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
      DataObject.from(rawManagerDatum)
    );
    const lucidTx = this.lucid.newTx();
    const factoryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
    ]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    const managerRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].manager
    ]);
    invariant(
      managerRefs.length === 1,
      "cannot find deployed script for LbeV2 Manager"
    );
    lucidTx.readFrom(managerRefs);
    lucidTx.readFrom([treasuryUtxo]);
    lucidTx.collectFrom(
      [managerUtxo],
      DataObject.to(
        LbeV2Types.ManagerRedeemer.toPlutusData(
          LbeV2Types.ManagerRedeemer.ADD_SELLERS
        )
      )
    );
    lucidTx.mint(
      { [config.sellerAsset]: BigInt(addSellerCount) },
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MINT_SELLER
        })
      )
    );
    const newManagerDatum = {
      ...managerDatum,
      sellerCount: managerDatum.sellerCount + BigInt(addSellerCount)
    };
    lucidTx.payToContract(
      config.managerAddress,
      {
        Inline: DataObject.to(LbeV2Types.ManagerDatum.toPlutusData(newManagerDatum))
      },
      { ...managerUtxo.assets }
    );
    for (let i = 0; i < addSellerCount; ++i) {
      lucidTx.payToContract(
        config.sellerAddress,
        {
          Inline: DataObject.to(
            LbeV2Types.SellerDatum.toPlutusData({
              factoryPolicyId: config.factoryHash,
              owner: sellerOwner,
              baseAsset: treasuryDatum.baseAsset,
              raiseAsset: treasuryDatum.raiseAsset,
              amount: 0n,
              penaltyAmount: 0n
            })
          )
        },
        {
          [config.sellerAsset]: 1n,
          lovelace: LbeV2Constant.SELLER_MIN_ADA
        }
      );
    }
    lucidTx.validFrom(currentTime).validTo(
      Math.min(
        currentTime + THREE_HOUR_IN_MS,
        Number(treasuryDatum.endTime) - 1e3
      )
    );
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_ADD_SELLERS]
    });
    return lucidTx.commit();
  }
  async countingSellers(options) {
    validateCountingSeller(options, this.lucid, this.networkId);
    const { treasuryUtxo, managerUtxo, sellerUtxos, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawManagerDatum = managerUtxo.datum;
    invariant(rawManagerDatum, "Treasury utxo must have inline datum");
    const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
      DataObject.from(rawManagerDatum)
    );
    const sortedSellerUtxos = [...sellerUtxos].sort(compareUtxo);
    const sellerDatums = sortedSellerUtxos.map((utxo) => {
      const rawSellerDatum = utxo.datum;
      invariant(rawSellerDatum, "Seller utxo must have inline datum");
      const sellerDatum = LbeV2Types.SellerDatum.fromPlutusData(
        DataObject.from(rawSellerDatum),
        this.networkId
      );
      return sellerDatum;
    });
    const lucidTx = this.lucid.newTx();
    const factoryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
    ]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    const managerRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].manager
    ]);
    invariant(
      managerRefs.length === 1,
      "cannot find deployed script for LbeV2 Manager"
    );
    lucidTx.readFrom(managerRefs);
    const sellerRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].seller
    ]);
    invariant(
      sellerRefs.length === 1,
      "cannot find deployed script for LbeV2 Seller"
    );
    lucidTx.readFrom(sellerRefs);
    lucidTx.readFrom([treasuryUtxo]);
    lucidTx.collectFrom(
      [managerUtxo],
      DataObject.to(
        LbeV2Types.ManagerRedeemer.toPlutusData(
          LbeV2Types.ManagerRedeemer.COLLECT_SELLERS
        )
      )
    );
    lucidTx.collectFrom(
      sellerUtxos,
      DataObject.to(
        LbeV2Types.SellerRedeemer.toPlutusData(
          LbeV2Types.SellerRedeemer.COUNTING_SELLERS
        )
      )
    );
    lucidTx.mint(
      { [config.sellerAsset]: -BigInt(sellerUtxos.length) },
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.BURN_SELLER
        })
      )
    );
    let totalReserveRaise = 0n;
    let totalPenalty = 0n;
    for (const sellerDatum of sellerDatums) {
      totalReserveRaise += sellerDatum.amount;
      totalPenalty += sellerDatum.penaltyAmount;
    }
    const newManagerDatum = {
      ...managerDatum,
      reserveRaise: managerDatum.reserveRaise + totalReserveRaise,
      totalPenalty: managerDatum.totalPenalty + totalPenalty,
      sellerCount: managerDatum.sellerCount - BigInt(sellerUtxos.length)
    };
    lucidTx.payToContract(
      config.managerAddress,
      {
        Inline: DataObject.to(LbeV2Types.ManagerDatum.toPlutusData(newManagerDatum))
      },
      { ...managerUtxo.assets }
    );
    for (let i = 0; i < sellerDatums.length; ++i) {
      const sellerDatum = sellerDatums[i];
      const sellerUtxo = sortedSellerUtxos[i];
      lucidTx.payTo(sellerDatum.owner, {
        lovelace: sellerUtxo.assets["lovelace"] - LbeV2Constant.COLLECT_SELLER_COMMISSION
      });
    }
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_COUNTING_SELLERS]
    });
    return lucidTx.commit();
  }
  async collectManager(options) {
    validateCollectManager(options, this.lucid, this.networkId);
    const { treasuryUtxo, managerUtxo, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawManagerDatum = managerUtxo.datum;
    invariant(rawManagerDatum, "Treasury utxo must have inline datum");
    const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
      DataObject.from(rawManagerDatum)
    );
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const lucidTx = this.lucid.newTx();
    const factoryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
    ]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    const managerRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].manager
    ]);
    invariant(
      managerRefs.length === 1,
      "cannot find deployed script for LbeV2 Manager"
    );
    lucidTx.readFrom(managerRefs);
    const treasuryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].treasury
    ]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Treasury"
    );
    lucidTx.readFrom(treasuryRefs);
    lucidTx.collectFrom(
      [managerUtxo],
      DataObject.to(
        LbeV2Types.ManagerRedeemer.toPlutusData(
          LbeV2Types.ManagerRedeemer.SPEND_MANAGER
        )
      )
    );
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.COLLECT_MANAGER
        })
      )
    );
    lucidTx.mint(
      { [config.managerAsset]: -1n },
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MINT_MANAGER
        })
      )
    );
    lucidTx.payToContract(
      treasuryUtxo.address,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData({
            ...treasuryDatum,
            isManagerCollected: true,
            reserveRaise: managerDatum.reserveRaise,
            totalPenalty: managerDatum.totalPenalty
          })
        )
      },
      treasuryUtxo.assets
    );
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_COLLECT_MANAGER]
    });
    return lucidTx.commit();
  }
  async collectOrders(options) {
    validateCollectOrders(options, this.networkId);
    const { treasuryUtxo, orderUtxos, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const sortedOrderUtxos = [...orderUtxos].sort(compareUtxo);
    const orderDatums = sortedOrderUtxos.map((utxo) => {
      const rawOrderDatum = utxo.datum;
      invariant(rawOrderDatum, "Order utxo must have inline datum");
      return LbeV2Types.OrderDatum.fromPlutusData(
        DataObject.from(rawOrderDatum),
        this.networkId
      );
    });
    let deltaCollectedFund = 0n;
    for (const orderDatum of orderDatums) {
      deltaCollectedFund += orderDatum.amount + orderDatum.penaltyAmount;
    }
    const lucidTx = this.lucid.newTx();
    const orderRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].order
    ]);
    invariant(
      orderRefs.length === 1,
      "cannot find deployed script for LbeV2 Order"
    );
    lucidTx.readFrom(orderRefs);
    const factoryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
    ]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    const treasuryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].treasury
    ]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Treasury"
    );
    lucidTx.readFrom(treasuryRefs);
    lucidTx.collectFrom(
      orderUtxos,
      DataObject.to(
        LbeV2Types.OrderRedeemer.toPlutusData(
          LbeV2Types.OrderRedeemer.COLLECT_ORDER
        )
      )
    );
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.COLLECT_ORDERS
        })
      )
    );
    const newTreasuryAssets = { ...treasuryUtxo.assets };
    const raiseAssetUnit = Asset.toString(treasuryDatum.raiseAsset);
    if (raiseAssetUnit in newTreasuryAssets) {
      newTreasuryAssets[raiseAssetUnit] = newTreasuryAssets[raiseAssetUnit] + deltaCollectedFund;
    } else {
      newTreasuryAssets[raiseAssetUnit] = deltaCollectedFund;
    }
    lucidTx.payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData({
            ...treasuryDatum,
            collectedFund: treasuryDatum.collectedFund + deltaCollectedFund
          })
        )
      },
      newTreasuryAssets
    );
    for (let i = 0; i < orderDatums.length; ++i) {
      const orderDatum = orderDatums[i];
      const orderUtxo = sortedOrderUtxos[i];
      lucidTx.payToContract(
        orderUtxo.address,
        {
          Inline: DataObject.to(
            LbeV2Types.OrderDatum.toPlutusData({
              ...orderDatum,
              isCollected: true
            })
          )
        },
        {
          [config.orderAsset]: 1n,
          lovelace: LbeV2Constant.ORDER_MIN_ADA + LbeV2Constant.ORDER_COMMISSION
        }
      );
    }
    lucidTx.withdraw(
      config.factoryRewardAddress,
      0n,
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MANAGE_ORDER
        })
      )
    );
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_COLLECT_ORDER]
    });
    return lucidTx.commit();
  }
  calculateRedeemAmount(params) {
    const { userAmount, totalPenalty, reserveRaise, totalLiquidity, maxRaise } = params;
    if (userAmount <= 0n) {
      throw new Error("User amount must be higher than 0n");
    }
    if (totalLiquidity <= 0n) {
      throw new Error("totalLiquidity must be higher than 0n");
    }
    if (reserveRaise <= 0n) {
      throw new Error("reserveRaise must be higher than 0n");
    }
    const totalReturnedRaiseAsset = maxRaise && maxRaise < totalPenalty + reserveRaise ? totalPenalty + reserveRaise - maxRaise : 0n;
    return {
      liquidityAmount: totalLiquidity * userAmount / reserveRaise,
      returnedRaiseAmount: totalReturnedRaiseAsset * userAmount / reserveRaise
    };
  }
  async redeemOrders(options) {
    validateRedeemOrders(options, this.networkId);
    const { treasuryUtxo, orderUtxos, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const sortedOrderUtxos = [...orderUtxos].sort(compareUtxo);
    const orderDatums = sortedOrderUtxos.map((utxo) => {
      const rawOrderDatum = utxo.datum;
      invariant(rawOrderDatum, "Order utxo must have inline datum");
      return LbeV2Types.OrderDatum.fromPlutusData(
        DataObject.from(rawOrderDatum),
        this.networkId
      );
    });
    const raiseAssetUnit = Asset.toString(treasuryDatum.raiseAsset);
    const dexV2Config = DexV2Constant.CONFIG[this.networkId];
    const lpAssetUnit = dexV2Config.lpPolicyId + PoolV2.computeLPAssetName(
      treasuryDatum.raiseAsset,
      treasuryDatum.baseAsset
    );
    const orderOutputs = [];
    let totalFund = 0n;
    let totalOrderLiquidity = 0n;
    let totalOrderBonusRaise = 0n;
    for (const orderDatum of orderDatums) {
      let lpAmount = 0n;
      let bonusRaise = 0n;
      if (orderDatum.amount !== 0n) {
        const result = this.calculateRedeemAmount({
          userAmount: orderDatum.amount,
          totalPenalty: treasuryDatum.totalPenalty,
          reserveRaise: treasuryDatum.reserveRaise,
          totalLiquidity: treasuryDatum.totalLiquidity,
          maxRaise: treasuryDatum.maximumRaise
        });
        lpAmount = result.liquidityAmount;
        bonusRaise = result.returnedRaiseAmount;
      }
      totalFund += orderDatum.amount + orderDatum.penaltyAmount;
      totalOrderLiquidity += lpAmount;
      totalOrderBonusRaise += bonusRaise;
      const orderOutAssets = {
        lovelace: LbeV2Constant.ORDER_MIN_ADA
      };
      if (lpAmount > 0n) {
        orderOutAssets[lpAssetUnit] = lpAmount;
      }
      if (bonusRaise > 0n) {
        if (raiseAssetUnit in orderOutAssets) {
          orderOutAssets[raiseAssetUnit] = orderOutAssets[raiseAssetUnit] + bonusRaise;
        } else {
          orderOutAssets[raiseAssetUnit] = bonusRaise;
        }
      }
      orderOutputs.push({ address: orderDatum.owner, assets: orderOutAssets });
    }
    const lucidTx = this.lucid.newTx();
    const deployed = LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId];
    const orderRefs = await this.lucid.utxosByOutRef([deployed.order]);
    invariant(
      orderRefs.length === 1,
      "cannot find deployed script for LbeV2 Order"
    );
    lucidTx.readFrom(orderRefs);
    const treasuryRefs = await this.lucid.utxosByOutRef([deployed.treasury]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Treasury"
    );
    lucidTx.readFrom(treasuryRefs);
    const factoryRefs = await this.lucid.utxosByOutRef([deployed.factory]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    lucidTx.collectFrom(
      orderUtxos,
      DataObject.to(
        LbeV2Types.OrderRedeemer.toPlutusData(
          LbeV2Types.OrderRedeemer.REDEEM_ORDER
        )
      )
    );
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.REDEEM_ORDERS
        })
      )
    );
    const newTreasuryAssets = { ...treasuryUtxo.assets };
    if (raiseAssetUnit in newTreasuryAssets && totalOrderBonusRaise > 0n) {
      newTreasuryAssets[raiseAssetUnit] = newTreasuryAssets[raiseAssetUnit] - totalOrderBonusRaise;
      if (newTreasuryAssets[raiseAssetUnit] === 0n) {
        delete newTreasuryAssets[raiseAssetUnit];
      }
    }
    if (lpAssetUnit in newTreasuryAssets && totalOrderLiquidity > 0n) {
      newTreasuryAssets[lpAssetUnit] = newTreasuryAssets[lpAssetUnit] - totalOrderLiquidity;
      if (newTreasuryAssets[lpAssetUnit] === 0n) {
        delete newTreasuryAssets[lpAssetUnit];
      }
    }
    lucidTx.payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData({
            ...treasuryDatum,
            collectedFund: treasuryDatum.collectedFund - totalFund
          })
        )
      },
      newTreasuryAssets
    );
    for (const { assets, address } of orderOutputs) {
      lucidTx.payTo(address, assets);
    }
    lucidTx.mint(
      { [config.orderAsset]: -BigInt(orderDatums.length) },
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MINT_REDEEM_ORDERS
        })
      )
    );
    lucidTx.withdraw(
      config.factoryRewardAddress,
      0n,
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MANAGE_ORDER
        })
      )
    );
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_REDEEM_LP]
    });
    return lucidTx.commit();
  }
  async refundOrders(options) {
    validateRefundOrders(options, this.networkId);
    const { treasuryUtxo, orderUtxos, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const sortedOrderUtxos = [...orderUtxos].sort(compareUtxo);
    const orderDatums = sortedOrderUtxos.map((utxo) => {
      const rawOrderDatum = utxo.datum;
      invariant(rawOrderDatum, "Order utxo must have inline datum");
      return LbeV2Types.OrderDatum.fromPlutusData(
        DataObject.from(rawOrderDatum),
        this.networkId
      );
    });
    const raiseAssetUnit = Asset.toString(treasuryDatum.raiseAsset);
    const orderOutputs = [];
    let refundAmount = 0n;
    let totalOrderAmount = 0n;
    let totalOrderPenalty = 0n;
    for (const orderDatum of orderDatums) {
      const orderRefundAmount = orderDatum.amount + orderDatum.penaltyAmount;
      refundAmount += orderRefundAmount;
      totalOrderAmount += orderDatum.amount;
      totalOrderPenalty += orderDatum.penaltyAmount;
      const orderOutAssets = {
        lovelace: LbeV2Constant.ORDER_MIN_ADA
      };
      if (orderRefundAmount > 0n) {
        if (raiseAssetUnit in orderOutAssets) {
          orderOutAssets[raiseAssetUnit] = orderOutAssets[raiseAssetUnit] + orderRefundAmount;
        } else {
          orderOutAssets[raiseAssetUnit] = orderRefundAmount;
        }
      }
      orderOutputs.push({
        address: orderDatum.owner,
        assets: orderOutAssets
      });
    }
    const lucidTx = this.lucid.newTx();
    const deployed = LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId];
    const orderRefs = await this.lucid.utxosByOutRef([deployed.order]);
    invariant(
      orderRefs.length === 1,
      "cannot find deployed script for LbeV2 Order"
    );
    lucidTx.readFrom(orderRefs);
    const treasuryRefs = await this.lucid.utxosByOutRef([deployed.treasury]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Treasury"
    );
    lucidTx.readFrom(treasuryRefs);
    const factoryRefs = await this.lucid.utxosByOutRef([deployed.factory]);
    invariant(
      factoryRefs.length === 1,
      "cannot find deployed script for LbeV2 Factory"
    );
    lucidTx.readFrom(factoryRefs);
    lucidTx.collectFrom(
      orderUtxos,
      DataObject.to(
        LbeV2Types.OrderRedeemer.toPlutusData(
          LbeV2Types.OrderRedeemer.REDEEM_ORDER
        )
      )
    );
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.REDEEM_ORDERS
        })
      )
    );
    const newTreasuryAssets = { ...treasuryUtxo.assets };
    if (raiseAssetUnit in newTreasuryAssets) {
      newTreasuryAssets[raiseAssetUnit] = newTreasuryAssets[raiseAssetUnit] - refundAmount;
      if (newTreasuryAssets[raiseAssetUnit] === 0n) {
        delete newTreasuryAssets[raiseAssetUnit];
      }
    }
    lucidTx.payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData({
            ...treasuryDatum,
            collectedFund: treasuryDatum.collectedFund - refundAmount,
            reserveRaise: treasuryDatum.collectedFund - totalOrderAmount,
            totalPenalty: treasuryDatum.totalPenalty - totalOrderPenalty
          })
        )
      },
      newTreasuryAssets
    );
    for (const { assets, address } of orderOutputs) {
      lucidTx.payTo(address, assets);
    }
    lucidTx.mint(
      { [config.orderAsset]: -BigInt(orderDatums.length) },
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MINT_REDEEM_ORDERS
        })
      )
    );
    lucidTx.withdraw(
      config.factoryRewardAddress,
      0n,
      DataObject.to(
        LbeV2Types.FactoryRedeemer.toPlutusData({
          type: LbeV2Types.FactoryRedeemerType.MANAGE_ORDER
        })
      )
    );
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_REFUND]
    });
    return lucidTx.commit();
  }
  async createAmmPool(options) {
    validateCreateAmmPool(options, this.networkId);
    const { treasuryUtxo, ammFactoryUtxo, currentSlot } = options;
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    const config = LbeV2Constant.CONFIG[this.networkId];
    const rawTreasuryDatum = treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const {
      baseAsset,
      raiseAsset,
      maximumRaise,
      collectedFund,
      receiver,
      reserveBase,
      poolBaseFee,
      poolAllocation
    } = treasuryDatum;
    let totalReserveRaise;
    if (maximumRaise && maximumRaise < collectedFund) {
      totalReserveRaise = maximumRaise;
    } else {
      totalReserveRaise = collectedFund;
    }
    const [assetA, assetB] = Asset.compare(baseAsset, raiseAsset) < 0 ? [baseAsset, raiseAsset] : [raiseAsset, baseAsset];
    const lpAssetName = PoolV2.computeLPAssetName(assetA, assetB);
    const lpAsset = {
      tokenName: lpAssetName,
      policyId: DexV2Constant.CONFIG[this.networkId].lpPolicyId
    };
    let reserveA;
    let reserveB;
    if (Asset.compare(assetA, baseAsset) === 0) {
      reserveA = reserveBase;
      reserveB = totalReserveRaise;
    } else {
      reserveA = totalReserveRaise;
      reserveB = reserveBase;
    }
    const poolReserveA = reserveA * poolAllocation / 100n;
    const poolReserveB = reserveB * poolAllocation / 100n;
    const totalLiquidity = DexV2Calculation.calculateInitialLiquidity({
      amountA: poolReserveA,
      amountB: poolReserveB
    });
    const totalLbeLPs = totalLiquidity - PoolV2.MINIMUM_LIQUIDITY;
    const receiverLP = totalLbeLPs * (poolAllocation - 50n) / poolAllocation;
    const treasuryOutDatum = {
      ...treasuryDatum,
      totalLiquidity: totalLbeLPs - receiverLP
    };
    const lucidTx = this.lucid.newTx();
    const treasuryRefs = await this.lucid.utxosByOutRef([
      LbeV2Constant.DEPLOYED_SCRIPTS[this.networkId].treasury
    ]);
    invariant(
      treasuryRefs.length === 1,
      "cannot find deployed script for LbeV2 Treasury"
    );
    lucidTx.readFrom(treasuryRefs);
    lucidTx.collectFrom(
      [treasuryUtxo],
      DataObject.to(
        LbeV2Types.TreasuryRedeemer.toPlutusData({
          type: LbeV2Types.TreasuryRedeemerType.CREATE_AMM_POOL
        })
      )
    );
    const receiveAssets = {};
    if (reserveA - poolReserveA !== 0n) {
      receiveAssets[Asset.toString(assetA)] = reserveA - poolReserveA;
    }
    if (reserveB - poolReserveB !== 0n) {
      receiveAssets[Asset.toString(assetB)] = reserveB - poolReserveB;
    }
    if (receiverLP) {
      receiveAssets[Asset.toString(lpAsset)] = receiverLP;
    }
    lucidTx.payTo(receiver, receiveAssets);
    const newTreasuryAssets = {
      ...treasuryUtxo.assets
    };
    delete newTreasuryAssets[Asset.toString(baseAsset)];
    newTreasuryAssets[Asset.toString(raiseAsset)] -= totalReserveRaise;
    if (newTreasuryAssets[Asset.toString(raiseAsset)] === 0n) {
      delete newTreasuryAssets[Asset.toString(raiseAsset)];
    }
    if (totalLbeLPs - receiverLP !== 0n) {
      newTreasuryAssets[Asset.toString(lpAsset)] = totalLbeLPs - receiverLP;
    }
    newTreasuryAssets["lovelace"] -= LbeV2Constant.CREATE_POOL_COMMISSION;
    lucidTx.payToContract(
      config.treasuryAddress,
      {
        Inline: DataObject.to(
          LbeV2Types.TreasuryDatum.toPlutusData(treasuryOutDatum)
        )
      },
      newTreasuryAssets
    );
    const poolBatchingStakeCredential = Addresses.inspect(
      DexV2Constant.CONFIG[this.networkId].poolBatchingAddress
    )?.delegation;
    invariant(
      poolBatchingStakeCredential,
      `cannot parse Liquidity Pool batching address`
    );
    const poolDatum = {
      poolBatchingStakeCredential,
      assetA,
      assetB,
      totalLiquidity,
      reserveA: poolReserveA,
      reserveB: poolReserveB,
      baseFee: {
        feeANumerator: poolBaseFee,
        feeBNumerator: poolBaseFee
      },
      feeSharingNumerator: void 0,
      allowDynamicFee: false
    };
    await this.buildCreateAMMPool(lucidTx, poolDatum, ammFactoryUtxo, lpAsset);
    lucidTx.validFrom(currentTime).validTo(currentTime + THREE_HOUR_IN_MS);
    lucidTx.attachMetadata(674, {
      msg: [MetadataMessage.LBE_V2_CREATE_AMM_POOL]
    });
    return lucidTx.commit();
  }
  async buildCreateAMMPool(lucidTx, poolDatum, factoryUtxo, lpAsset) {
    const dexV2Config = DexV2Constant.CONFIG[this.networkId];
    const { assetA, assetB, reserveA, reserveB, totalLiquidity } = poolDatum;
    const lpAssetName = lpAsset.tokenName;
    const poolAssets = {
      lovelace: PoolV2.DEFAULT_POOL_ADA,
      [Asset.toString(lpAsset)]: PoolV2.MAX_LIQUIDITY - (totalLiquidity - PoolV2.MINIMUM_LIQUIDITY),
      [dexV2Config.poolAuthenAsset]: 1n
    };
    if (poolAssets[Asset.toString(assetA)]) {
      poolAssets[Asset.toString(assetA)] += reserveA;
    } else {
      poolAssets[Asset.toString(assetA)] = reserveA;
    }
    if (poolAssets[Asset.toString(assetB)]) {
      poolAssets[Asset.toString(assetB)] += reserveB;
    } else {
      poolAssets[Asset.toString(assetB)] = reserveB;
    }
    const rawFactoryDatum = factoryUtxo.datum;
    invariant(rawFactoryDatum, "Treasury utxo must have inline datum");
    const factoryDatum = FactoryV2.Datum.fromPlutusData(
      DataObject.from(rawFactoryDatum)
    );
    const newFactoryDatum1 = {
      head: factoryDatum.head,
      tail: lpAssetName
    };
    const newFactoryDatum2 = {
      head: lpAssetName,
      tail: factoryDatum.tail
    };
    const ammFactoryRefs = await this.lucid.utxosByOutRef([
      DexV2Constant.DEPLOYED_SCRIPTS[this.networkId].factory
    ]);
    invariant(
      ammFactoryRefs.length === 1,
      "cannot find deployed script for Factory Validator"
    );
    const ammFactoryRef = ammFactoryRefs[0];
    const ammAuthenRefs = await this.lucid.utxosByOutRef([
      DexV2Constant.DEPLOYED_SCRIPTS[this.networkId].authen
    ]);
    invariant(
      ammAuthenRefs.length === 1,
      "cannot find deployed script for Authen Minting Policy"
    );
    const ammAuthenRef = ammAuthenRefs[0];
    lucidTx.collectFrom(
      [factoryUtxo],
      DataObject.to(
        FactoryV2.Redeemer.toPlutusData({
          assetA,
          assetB
        })
      )
    );
    lucidTx.payToContract(
      dexV2Config.poolCreationAddress,
      {
        Inline: DataObject.to(PoolV2.Datum.toPlutusData(poolDatum))
      },
      poolAssets
    ).payToContract(
      dexV2Config.factoryAddress,
      {
        Inline: DataObject.to(FactoryV2.Datum.toPlutusData(newFactoryDatum1))
      },
      {
        [dexV2Config.factoryAsset]: 1n
      }
    ).payToContract(
      dexV2Config.factoryAddress,
      {
        Inline: DataObject.to(FactoryV2.Datum.toPlutusData(newFactoryDatum2))
      },
      {
        [dexV2Config.factoryAsset]: 1n
      }
    );
    lucidTx.mint(
      {
        [Asset.toString(lpAsset)]: PoolV2.MAX_LIQUIDITY,
        [dexV2Config.factoryAsset]: 1n,
        [dexV2Config.poolAuthenAsset]: 1n
      },
      DataObject.to(new Constr(1, []))
    );
    lucidTx.readFrom([ammFactoryRef, ammAuthenRef]);
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
class LbeV2Worker {
  constructor({
    networkEnv,
    networkId,
    lucid,
    blockfrostAdapter,
    privateKey
  }) {
    __publicField$1(this, "networkEnv");
    __publicField$1(this, "networkId");
    __publicField$1(this, "lucid");
    __publicField$1(this, "blockfrostAdapter");
    __publicField$1(this, "privateKey");
    this.networkEnv = networkEnv;
    this.networkId = networkId;
    this.lucid = lucid;
    this.blockfrostAdapter = blockfrostAdapter;
    this.privateKey = privateKey;
  }
  async start() {
    await runRecurringJob({
      name: "lbe v2 batcher",
      interval: 1e3 * 30,
      // 30s
      job: () => this.runWorker()
    });
  }
  async getData() {
    const { treasuries: allTreasuries } = await this.blockfrostAdapter.getAllLbeV2Treasuries();
    const treasuryUtxos = await this.lucid.utxosByOutRef(
      allTreasuries.map((treasury) => ({
        txHash: treasury.txIn.txHash,
        outputIndex: treasury.txIn.index
      }))
    );
    const { managers: allManagers } = await this.blockfrostAdapter.getAllLbeV2Managers();
    const managerUtxos = await this.lucid.utxosByOutRef(
      allManagers.map((manager) => ({
        txHash: manager.txIn.txHash,
        outputIndex: manager.txIn.index
      }))
    );
    const { sellers: allSellers } = await this.blockfrostAdapter.getAllLbeV2Sellers();
    const sellerUtxos = await this.lucid.utxosByOutRef(
      allSellers.map((seller) => ({
        txHash: seller.txIn.txHash,
        outputIndex: seller.txIn.index
      }))
    );
    const { orders: allOrders } = await this.blockfrostAdapter.getAllLbeV2Orders();
    const orderUtxos = await this.lucid.utxosByOutRef(
      allOrders.map((order) => ({
        txHash: order.txIn.txHash,
        outputIndex: order.txIn.index
      }))
    );
    const mapEventData = {};
    for (const treasuryUtxo of treasuryUtxos) {
      const rawTreasuryDatum = treasuryUtxo.datum;
      invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
      const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
        this.networkId,
        DataObject.from(rawTreasuryDatum)
      );
      const lbeId = PoolV2.computeLPAssetName(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      );
      mapEventData[lbeId] = {
        treasuryUtxo,
        sellerUtxos: [],
        collectedOrderUtxos: [],
        uncollectedOrderUtxos: []
      };
    }
    for (const managerUtxo of managerUtxos) {
      const rawManagerDatum = managerUtxo.datum;
      invariant(rawManagerDatum, "Manager utxo must have inline datum");
      const managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
        DataObject.from(rawManagerDatum)
      );
      const lbeId = PoolV2.computeLPAssetName(
        managerDatum.baseAsset,
        managerDatum.raiseAsset
      );
      mapEventData[lbeId].managerUtxo = managerUtxo;
    }
    for (const sellerUtxo of sellerUtxos) {
      const rawDatum = sellerUtxo.datum;
      invariant(rawDatum, "Seller utxo must have inline datum");
      const datum = LbeV2Types.SellerDatum.fromPlutusData(
        DataObject.from(rawDatum),
        this.networkId
      );
      const lbeId = PoolV2.computeLPAssetName(
        datum.baseAsset,
        datum.raiseAsset
      );
      mapEventData[lbeId].sellerUtxos.push(sellerUtxo);
    }
    for (const orderUtxo of orderUtxos) {
      const rawDatum = orderUtxo.datum;
      invariant(rawDatum, "Order utxo must have inline datum");
      const datum = LbeV2Types.OrderDatum.fromPlutusData(
        DataObject.from(rawDatum),
        this.networkId
      );
      const lbeId = PoolV2.computeLPAssetName(
        datum.baseAsset,
        datum.raiseAsset
      );
      if (datum.isCollected === true) {
        mapEventData[lbeId].collectedOrderUtxos.push(orderUtxo);
      } else {
        mapEventData[lbeId].uncollectedOrderUtxos.push(orderUtxo);
      }
    }
    return Object.values(mapEventData);
  }
  async countingSellers(eventData, currentTime) {
    const { treasuryUtxo, managerUtxo, sellerUtxos } = eventData;
    invariant(managerUtxo, "collectSellers: can not find manager");
    const txComplete = await new LbeV2(this.lucid).countingSellers({
      treasuryUtxo,
      managerUtxo,
      sellerUtxos: sellerUtxos.slice(0, LbeV2Constant.MINIMUM_SELLER_COLLECTED),
      currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
    });
    const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
    const txId = await signedTx.submit();
    console.info(`Counting seller transaction submitted successfully: ${txId}`);
  }
  async collectManager(eventData, currentTime) {
    const { treasuryUtxo, managerUtxo } = eventData;
    invariant(managerUtxo, "collectManager: can not find manager");
    const txComplete = await new LbeV2(this.lucid).collectManager({
      treasuryUtxo,
      managerUtxo,
      currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
    });
    const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
    const txId = await signedTx.submit();
    console.info(`Collect manager transaction submitted successfully: ${txId}`);
  }
  async collectOrders(eventData, currentTime) {
    const { treasuryUtxo, uncollectedOrderUtxos } = eventData;
    const txComplete = await new LbeV2(this.lucid).collectOrders({
      treasuryUtxo,
      orderUtxos: uncollectedOrderUtxos,
      currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
    });
    const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
    const txId = await signedTx.submit();
    console.info(`Collect orders transaction submitted successfully: ${txId}`);
  }
  async createAmmPoolOrCancelEvent(eventData, currentTime) {
    const { treasuryUtxo } = eventData;
    const rawTreasuryDatum = eventData.treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    if (treasuryDatum.collectedFund < (treasuryDatum.minimumRaise ?? 1n)) {
      const txComplete = await new LbeV2(this.lucid).cancelEvent({
        treasuryUtxo,
        cancelData: { reason: LbeV2Types.CancelReason.NOT_REACH_MINIMUM },
        currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
      });
      const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
      const txId = await signedTx.submit();
      console.info(
        `Cancel event by not reach min raise transaction submitted successfully: ${txId}`
      );
      return;
    }
    const ammFactory = await this.blockfrostAdapter.getFactoryV2ByPair(
      treasuryDatum.baseAsset,
      treasuryDatum.raiseAsset
    );
    if (ammFactory === null) {
      const poolV2 = await this.blockfrostAdapter.getV2PoolByPair(
        treasuryDatum.baseAsset,
        treasuryDatum.raiseAsset
      );
      invariant(poolV2 !== null, "Can not find pool");
      const ammPoolUtxos = await this.lucid.utxosByOutRef([
        { txHash: poolV2.txIn.txHash, outputIndex: poolV2.txIn.index }
      ]);
      invariant(ammPoolUtxos.length === 1, "Can not find amm pool Utxo");
      const txComplete = await new LbeV2(this.lucid).cancelEvent({
        treasuryUtxo,
        cancelData: {
          reason: LbeV2Types.CancelReason.CREATED_POOL,
          ammPoolUtxo: ammPoolUtxos[0]
        },
        currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
      });
      const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
      const txId = await signedTx.submit();
      console.info(
        `Cancel event by created pool transaction submitted successfully: ${txId}`
      );
    } else {
      const ammFactoryUtxos = await this.lucid.utxosByOutRef([
        { txHash: ammFactory.txIn.txHash, outputIndex: ammFactory.txIn.index }
      ]);
      invariant(ammFactoryUtxos.length === 1, "Can not find amm factory Utxo");
      const txComplete = await new LbeV2(this.lucid).createAmmPool({
        treasuryUtxo,
        ammFactoryUtxo: ammFactoryUtxos[0],
        currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
      });
      const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
      const txId = await signedTx.submit();
      console.info(
        `Create AMM Pool transaction submitted successfully: ${txId}`
      );
    }
  }
  async redeemOrders(eventData, currentTime) {
    const { treasuryUtxo, collectedOrderUtxos } = eventData;
    const txComplete = await new LbeV2(this.lucid).redeemOrders({
      treasuryUtxo,
      orderUtxos: collectedOrderUtxos,
      currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
    });
    const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
    const txId = await signedTx.submit();
    console.info(`Redeem Orders transaction submitted successfully: ${txId}`);
  }
  async refundOrders(eventData, currentTime) {
    const { treasuryUtxo, collectedOrderUtxos } = eventData;
    const txComplete = await new LbeV2(this.lucid).refundOrders({
      treasuryUtxo,
      orderUtxos: collectedOrderUtxos,
      currentSlot: this.lucid.utils.unixTimeToSlots(currentTime)
    });
    const signedTx = await txComplete.signWithPrivateKey(this.privateKey).commit();
    const txId = await signedTx.submit();
    console.info(`Refund Orders transaction submitted successfully: ${txId}`);
  }
  async handleEvent(eventData, currentTime) {
    const checkPhaseAndHandle = [
      // COUNTING SELLER
      {
        checkFn: (treasuryDatum2, managerDatum2) => {
          const { isManagerCollected: isManagerCollected2 } = treasuryDatum2;
          if (isManagerCollected2) {
            return false;
          }
          invariant(managerDatum2, "can not find manager datum");
          return managerDatum2.sellerCount > 0n;
        },
        handleFn: this.countingSellers.bind(this)
      },
      // COLLECT MANAGER
      {
        checkFn: (treasuryDatum2, managerDatum2) => {
          const { isManagerCollected: isManagerCollected2 } = treasuryDatum2;
          if (isManagerCollected2) {
            return false;
          }
          invariant(managerDatum2, "can not find manager datum");
          return true;
        },
        handleFn: this.collectManager.bind(this)
      },
      // COLLECT COLLECT ORDER
      {
        checkFn: (treasuryDatum2, _) => {
          const { reserveRaise: reserveRaise2, totalPenalty: totalPenalty2, collectedFund: collectedFund2 } = treasuryDatum2;
          return reserveRaise2 + totalPenalty2 > collectedFund2;
        },
        handleFn: this.collectOrders.bind(this)
      },
      // CREATE POOL OR CANCEL EVENT
      {
        checkFn: (treasuryDatum2, _) => {
          const {
            reserveRaise: reserveRaise2,
            totalPenalty: totalPenalty2,
            collectedFund: collectedFund2,
            isCancelled: isCancelled2,
            totalLiquidity: totalLiquidity2
          } = treasuryDatum2;
          return reserveRaise2 + totalPenalty2 === collectedFund2 && isCancelled2 === false && totalLiquidity2 === 0n;
        },
        handleFn: this.createAmmPoolOrCancelEvent.bind(this)
      },
      // REDEEM ORDERS
      {
        checkFn: (treasuryDatum2, _) => {
          const { totalLiquidity: totalLiquidity2, collectedFund: collectedFund2 } = treasuryDatum2;
          return totalLiquidity2 > 0n && collectedFund2 > 0n;
        },
        handleFn: this.redeemOrders.bind(this)
      },
      // REFUND ORDERS
      {
        checkFn: (treasuryDatum2, _) => {
          const { reserveRaise: reserveRaise2, totalPenalty: totalPenalty2, collectedFund: collectedFund2, isCancelled: isCancelled2 } = treasuryDatum2;
          return reserveRaise2 + totalPenalty2 === collectedFund2 && isCancelled2 === true && collectedFund2 > 0n;
        },
        handleFn: this.refundOrders.bind(this)
      }
    ];
    const rawTreasuryDatum = eventData.treasuryUtxo.datum;
    invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
    const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
      this.networkId,
      DataObject.from(rawTreasuryDatum)
    );
    const {
      endTime,
      isCancelled,
      totalPenalty,
      reserveRaise,
      isManagerCollected,
      totalLiquidity,
      collectedFund
    } = treasuryDatum;
    if (
      // NOT ENCOUNTER PHASE YET
      currentTime <= Number(endTime) && isCancelled === false || // CANCELLED EVENT, waiting for owner closing it.
      isCancelled === true && totalPenalty + reserveRaise === 0n && isManagerCollected === true || // FINISH EVENT
      totalLiquidity > 0n && collectedFund === 0n
    ) {
      return "skip";
    }
    let managerDatum = void 0;
    if (eventData.managerUtxo !== void 0) {
      const rawManagerDatum = eventData.managerUtxo.datum;
      invariant(rawManagerDatum, "Treasury utxo must have inline datum");
      managerDatum = LbeV2Types.ManagerDatum.fromPlutusData(
        DataObject.from(rawManagerDatum)
      );
    }
    for (const { checkFn, handleFn } of checkPhaseAndHandle) {
      if (checkFn(treasuryDatum, managerDatum)) {
        await handleFn(eventData, currentTime);
        return "success";
      }
    }
    return "success";
  }
  async runWorker() {
    const eventsData = await this.getData();
    const currentSlot = await this.blockfrostAdapter.currentSlot();
    const currentTime = this.lucid.utils.slotsToUnixTime(currentSlot);
    for (const eventData of eventsData) {
      try {
        const handleEventResult = await this.handleEvent(
          eventData,
          currentTime
        );
        if (handleEventResult === "success") {
          return;
        }
      } catch (err) {
        const rawTreasuryDatum = eventData.treasuryUtxo.datum;
        invariant(rawTreasuryDatum, "Treasury utxo must have inline datum");
        const treasuryDatum = LbeV2Types.TreasuryDatum.fromPlutusData(
          this.networkId,
          DataObject.from(rawTreasuryDatum)
        );
        console.error(
          `Fail to run worker for LBE ${PoolV2.computeLPAssetName(treasuryDatum.baseAsset, treasuryDatum.raiseAsset)}: ${err}`
        );
      }
    }
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class Stableswap {
  constructor(lucid) {
    __publicField(this, "lucid");
    __publicField(this, "networkId");
    this.lucid = lucid;
    this.networkId = lucid.network === "Mainnet" ? NetworkId.MAINNET : NetworkId.TESTNET;
  }
  buildOrderValue(option) {
    const orderAssets = {};
    switch (option.type) {
      case StableOrder.StepType.DEPOSIT: {
        const { minimumLPReceived, assetsAmount, totalLiquidity } = option;
        invariant(
          minimumLPReceived > 0n,
          "minimum LP received must be non-negative"
        );
        let sumAmount = 0n;
        for (const [asset, amount] of assetsAmount) {
          if (totalLiquidity === 0n) {
            invariant(
              amount > 0n,
              "amount must be positive when total liquidity = 0"
            );
          } else {
            invariant(amount >= 0n, "amount must be non-negative");
          }
          if (amount > 0n) {
            orderAssets[Asset.toString(asset)] = amount;
          }
          sumAmount += amount;
        }
        invariant(sumAmount > 0n, "sum of amount must be positive");
        break;
      }
      case StableOrder.StepType.SWAP: {
        const { assetInAmount, assetInIndex, lpAsset } = option;
        const poolConfig = StableswapConstant.getConfigByLpAsset(
          lpAsset,
          this.networkId
        );
        invariant(assetInAmount > 0n, "asset in amount must be positive");
        orderAssets[poolConfig.assets[Number(assetInIndex)]] = assetInAmount;
        break;
      }
      case StableOrder.StepType.WITHDRAW:
      case StableOrder.StepType.WITHDRAW_IMBALANCE:
      case StableOrder.StepType.ZAP_OUT: {
        const { lpAmount, lpAsset } = option;
        invariant(lpAmount > 0n, "Lp amount must be positive number");
        orderAssets[Asset.toString(lpAsset)] = lpAmount;
        break;
      }
    }
    if ("lovelace" in orderAssets) {
      orderAssets["lovelace"] += FIXED_DEPOSIT_ADA;
    } else {
      orderAssets["lovelace"] = FIXED_DEPOSIT_ADA;
    }
    return orderAssets;
  }
  buildOrderStep(option) {
    switch (option.type) {
      case StableOrder.StepType.DEPOSIT: {
        const { minimumLPReceived } = option;
        invariant(
          minimumLPReceived > 0n,
          "minimum LP received must be non-negative"
        );
        return {
          type: StableOrder.StepType.DEPOSIT,
          minimumLP: minimumLPReceived
        };
      }
      case StableOrder.StepType.WITHDRAW: {
        const { minimumAmounts } = option;
        let sumAmount = 0n;
        for (const amount of minimumAmounts) {
          invariant(amount >= 0n, "minimum amount must be non-negative");
          sumAmount += amount;
        }
        invariant(sumAmount > 0n, "sum of withdaw amount must be positive");
        return {
          type: StableOrder.StepType.WITHDRAW,
          minimumAmounts
        };
      }
      case StableOrder.StepType.SWAP: {
        const { lpAsset, assetInIndex, assetOutIndex, minimumAssetOut } = option;
        const poolConfig = StableswapConstant.getConfigByLpAsset(
          lpAsset,
          this.networkId
        );
        invariant(
          poolConfig,
          `Not found Stableswap config matching with LP Asset ${lpAsset.toString()}`
        );
        const assetLength = BigInt(poolConfig.assets.length);
        invariant(
          assetInIndex >= 0n && assetInIndex < assetLength,
          `Invalid amountInIndex, must be between 0-${assetLength - 1n}`
        );
        invariant(
          assetOutIndex >= 0n && assetOutIndex < assetLength,
          `Invalid assetOutIndex, must be between 0-${assetLength - 1n}`
        );
        invariant(
          assetInIndex !== assetOutIndex,
          `assetOutIndex and amountInIndex must be different`
        );
        invariant(
          minimumAssetOut > 0n,
          "minimum asset out amount must be positive"
        );
        return {
          type: StableOrder.StepType.SWAP,
          assetInIndex,
          assetOutIndex,
          minimumAssetOut
        };
      }
      case StableOrder.StepType.WITHDRAW_IMBALANCE: {
        const { withdrawAmounts } = option;
        let sum = 0n;
        for (const amount of withdrawAmounts) {
          invariant(amount >= 0n, "withdraw amount must be unsigned number");
          sum += amount;
        }
        invariant(sum > 0n, "sum of withdraw amount must be positive");
        return {
          type: StableOrder.StepType.WITHDRAW_IMBALANCE,
          withdrawAmounts
        };
      }
      case StableOrder.StepType.ZAP_OUT: {
        const { assetOutIndex, minimumAssetOut, lpAsset } = option;
        const poolConfig = StableswapConstant.getConfigByLpAsset(
          lpAsset,
          this.networkId
        );
        invariant(
          poolConfig,
          `Not found Stableswap config matching with LP Asset ${lpAsset.toString()}`
        );
        const assetLength = BigInt(poolConfig.assets.length);
        invariant(
          minimumAssetOut > 0n,
          "Minimum amount out must be positive number"
        );
        invariant(
          assetOutIndex >= 0n && assetOutIndex < assetLength,
          `Invalid assetOutIndex, must be between 0-${assetLength - 1n}`
        );
        return {
          type: StableOrder.StepType.ZAP_OUT,
          assetOutIndex,
          minimumAssetOut
        };
      }
    }
  }
  getOrderMetadata(options) {
    switch (options.type) {
      case StableOrder.StepType.SWAP: {
        return MetadataMessage.SWAP_EXACT_IN_ORDER;
      }
      case StableOrder.StepType.DEPOSIT: {
        let assetInputCnt = 0;
        for (const [_, amount] of options.assetsAmount) {
          if (amount > 0) {
            assetInputCnt++;
          }
        }
        if (assetInputCnt === 1) {
          return MetadataMessage.ZAP_IN_ORDER;
        } else {
          return MetadataMessage.DEPOSIT_ORDER;
        }
      }
      case StableOrder.StepType.WITHDRAW: {
        return MetadataMessage.WITHDRAW_ORDER;
      }
      case StableOrder.StepType.WITHDRAW_IMBALANCE: {
        return MetadataMessage.WITHDRAW_ORDER;
      }
      case StableOrder.StepType.ZAP_OUT: {
        return MetadataMessage.ZAP_OUT_ORDER;
      }
    }
  }
  async createBulkOrdersTx(options) {
    const { sender, options: orderOptions } = options;
    invariant(
      orderOptions.length > 0,
      "Stableswap.buildCreateTx: Need at least 1 order to build"
    );
    const totalOrderAssets = {};
    for (const option of orderOptions) {
      const orderAssets = this.buildOrderValue(option);
      for (const [asset, amt] of Object.entries(orderAssets)) {
        if (asset in totalOrderAssets) {
          totalOrderAssets[asset] += amt;
        } else {
          totalOrderAssets[asset] = amt;
        }
      }
    }
    const tx = this.lucid.newTx();
    for (const orderOption of orderOptions) {
      const config = StableswapConstant.getConfigByLpAsset(
        orderOption.lpAsset,
        this.networkId
      );
      const { customReceiver, type } = orderOption;
      const orderAssets = this.buildOrderValue(orderOption);
      const step = this.buildOrderStep(orderOption);
      const batcherFee = BATCHER_FEE_STABLESWAP[type];
      if ("lovelace" in orderAssets) {
        orderAssets["lovelace"] += batcherFee;
      } else {
        orderAssets["lovelace"] = batcherFee;
      }
      const datum = {
        sender,
        receiver: customReceiver ? customReceiver.receiver : sender,
        receiverDatumHash: customReceiver?.receiverDatum?.hash,
        step,
        batcherFee,
        depositADA: FIXED_DEPOSIT_ADA
      };
      tx.payToContract(
        config.orderAddress,
        {
          Inline: DataObject.to(StableOrder.Datum.toPlutusData(datum))
        },
        orderAssets
      );
      if (customReceiver && customReceiver.receiverDatum) {
        const utxoForStoringDatum = buildUtxoToStoreDatum(
          sender,
          customReceiver.receiver,
          customReceiver.receiverDatum.datum
        );
        if (utxoForStoringDatum) {
          tx.payToWithData(
            utxoForStoringDatum.address,
            utxoForStoringDatum.outputData,
            utxoForStoringDatum.assets
          );
        }
      }
    }
    tx.attachMetadata(674, {
      msg: [
        orderOptions.length > 1 ? MetadataMessage.MIXED_ORDERS : this.getOrderMetadata(orderOptions[0])
      ]
    });
    return await tx.commit();
  }
  async buildCancelOrdersTx(options) {
    const tx = this.lucid.newTx();
    const redeemer = DataObject.to(
      new Constr(StableOrder.Redeemer.CANCEL_ORDER, [])
    );
    for (const utxo of options.orderUtxos) {
      const config = StableswapConstant.getConfigFromStableswapOrderAddress(
        utxo.address,
        this.networkId
      );
      const referencesScript = StableswapConstant.getStableswapReferencesScript(
        Asset.fromString(config.nftAsset),
        this.networkId
      );
      let datum;
      if (utxo.datum) {
        const rawDatum = utxo.datum;
        datum = StableOrder.Datum.fromPlutusData(
          this.networkId,
          DataObject.from(rawDatum)
        );
      } else if (utxo.datumHash) {
        const rawDatum = await this.lucid.datumOf(utxo);
        datum = StableOrder.Datum.fromPlutusData(
          this.networkId,
          rawDatum
        );
      } else {
        throw new Error(
          "Utxo without Datum Hash or Inline Datum can not be spent"
        );
      }
      const orderRefs = await this.lucid.utxosByOutRef([
        referencesScript.order
      ]);
      invariant(
        orderRefs.length === 1,
        "cannot find deployed script for V2 Order"
      );
      const orderRef = orderRefs[0];
      tx.readFrom([orderRef]).collectFrom([utxo], redeemer).addSigner(Addresses.addressToCredential(datum.sender).hash);
    }
    tx.attachMetadata(674, { msg: [MetadataMessage.CANCEL_ORDER] });
    return await tx.commit();
  }
}

async function getBackendBlockfrostLucidInstance(networkId, projectId, blockfrostUrl, address) {
  const provider = new Blockfrost(blockfrostUrl, projectId);
  const lucid = new Lucid({
    provider,
    network: networkId === NetworkId.MAINNET ? "Mainnet" : "Preprod"
  });
  lucid.selectReadOnlyWallet({
    address
  });
  return lucid;
}
async function getBackendMaestroLucidInstance(network, apiKey, address) {
  const provider = new Maestro({
    network,
    apiKey
  });
  const lucid = new Lucid({
    provider,
    network
  });
  lucid.selectReadOnlyWallet({
    address
  });
  return lucid;
}

const DataObject = Data;

export { ADA, Asset, BlockfrostAdapter, DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR, Dao, DataObject, Dex, DexV1Constant, DexV2, DexV2Calculation, DexV2Constant, ExpiredOrderMonitor, FIXED_DEPOSIT_ADA, FactoryV2, LbeV2, LbeV2Constant, LbeV2Types, LbeV2Worker, MAX_POOL_V2_TRADING_FEE_NUMERATOR, MIN_POOL_V2_TRADING_FEE_NUMERATOR, MaestroAdapter, MetadataMessage, MinswapAdapter, NetworkEnvironment, NetworkId, OrderV1, OrderV2, PoolV1, PoolV2, SECURITY_PARAM, StableOrder, StablePool, Stableswap, StableswapCalculation, StableswapConstant, calculateAmountWithSlippageTolerance, calculateDeposit, calculateSwapExactIn, calculateSwapExactOut, calculateWithdraw, calculateZapIn, compareUtxo, getBackendBlockfrostLucidInstance, getBackendMaestroLucidInstance };
//# sourceMappingURL=index.es.js.map
