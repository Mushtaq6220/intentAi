import Big from 'big.js';
import { Constr, Script, OutRef, Credential, Utxo, Lucid, TxComplete, Tx, Assets, MaestroSupportedNetworks, Data } from '@spacebudz/lucid';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import * as OgmiosSchema from '@cardano-ogmios/schema';
import { MaestroClient } from '@maestro-org/typescript-sdk';
import * as Prisma from '@prisma/client';

declare const ADA: Asset;
type Asset = {
    policyId: string;
    tokenName: string;
};
declare namespace Asset {
    function fromString(s: string): Asset;
    function toString(asset: Asset): string;
    function toDottedString(asset: Asset): string;
    function toPlutusData(asset: Asset): Constr<DataType>;
    function fromPlutusData(data: Constr<DataType>): Asset;
    function compare(a1: Asset, a2: Asset): number;
    function equals(a1: Asset, a2: Asset): boolean;
}

declare enum NetworkId {
    TESTNET = 0,
    MAINNET = 1
}
declare enum NetworkEnvironment {
    MAINNET = 764824073,
    TESTNET_PREVIEW = 2,
    TESTNET_PREPROD = 1
}
type SlotConfig = {
    zeroTime: number;
    zeroSlot: number;
    slotLength: number;
};

type TxIn = {
    txHash: string;
    index: number;
};
type TxHistory = {
    txHash: string;
    /** Transaction index within the block */
    txIndex: number;
    blockHeight: number;
    time: Date;
};
type Value = {
    unit: string;
    quantity: string;
}[];
declare namespace Value {
    function fromOgmiosValue(ogmiosValue: OgmiosSchema.Value): Value;
}

declare namespace FactoryV2 {
    type Datum = {
        head: string;
        tail: string;
    };
    namespace Datum {
        function toPlutusData(datum: Datum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): Datum;
    }
    type Redeemer = {
        assetA: Asset;
        assetB: Asset;
    };
    namespace Redeemer {
        function toPlutusData(redeemer: Redeemer): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): Redeemer;
    }
    class State {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: Datum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get head(): string;
        get tail(): string;
    }
}

declare namespace LbeV2Types {
    enum ReceiverDatumType {
        NO_DATUM = 0,
        DATUM_HASH = 1,
        INLINE_DATUM = 2
    }
    type ReceiverDatum = {
        type: ReceiverDatumType.NO_DATUM;
    } | {
        type: ReceiverDatumType.DATUM_HASH | ReceiverDatumType.INLINE_DATUM;
        hash: string;
    };
    namespace ReceiverDatum {
        function toPlutusData(data: ReceiverDatum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): ReceiverDatum;
    }
    type PenaltyConfig = {
        penaltyStartTime: bigint;
        percent: bigint;
    };
    namespace PenaltyConfig {
        function toPlutusData(data: PenaltyConfig): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): PenaltyConfig;
    }
    type TreasuryDatum = {
        factoryPolicyId: string;
        managerHash: string;
        sellerHash: string;
        orderHash: string;
        baseAsset: Asset;
        raiseAsset: Asset;
        startTime: bigint;
        endTime: bigint;
        owner: string;
        receiver: string;
        receiverDatum: ReceiverDatum;
        poolAllocation: bigint;
        minimumOrderRaise?: bigint;
        minimumRaise?: bigint;
        maximumRaise?: bigint;
        reserveBase: bigint;
        penaltyConfig?: PenaltyConfig;
        poolBaseFee: bigint;
        revocable: boolean;
        collectedFund: bigint;
        reserveRaise: bigint;
        totalPenalty: bigint;
        totalLiquidity: bigint;
        isCancelled: boolean;
        isManagerCollected: boolean;
    };
    namespace TreasuryDatum {
        function toPlutusData(datum: TreasuryDatum): Constr<DataType>;
        function fromPlutusData(networkId: NetworkId, data: Constr<DataType>): TreasuryDatum;
    }
    enum TreasuryRedeemerType {
        COLLECT_MANAGER = 0,
        COLLECT_ORDERS = 1,
        CREATE_AMM_POOL = 2,
        REDEEM_ORDERS = 3,
        CLOSE_EVENT = 4,
        CANCEL_LBE = 5,
        UPDATE_LBE = 6
    }
    enum CancelReason {
        CREATED_POOL = 0,
        BY_OWNER = 1,
        NOT_REACH_MINIMUM = 2
    }
    type TreasuryRedeemer = {
        type: TreasuryRedeemerType.COLLECT_MANAGER | TreasuryRedeemerType.COLLECT_ORDERS | TreasuryRedeemerType.CREATE_AMM_POOL | TreasuryRedeemerType.REDEEM_ORDERS | TreasuryRedeemerType.CLOSE_EVENT | TreasuryRedeemerType.UPDATE_LBE;
    } | {
        type: TreasuryRedeemerType.CANCEL_LBE;
        reason: CancelReason;
    };
    namespace TreasuryRedeemer {
        function toPlutusData(data: TreasuryRedeemer): Constr<DataType>;
    }
    class TreasuryState {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: TreasuryDatum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get lbeId(): string;
    }
    type LbeV2Parameters = {
        baseAsset: Asset;
        reserveBase: bigint;
        raiseAsset: Asset;
        startTime: bigint;
        endTime: bigint;
        owner: string;
        receiver: string;
        poolAllocation: bigint;
        minimumOrderRaise?: bigint;
        minimumRaise?: bigint;
        maximumRaise?: bigint;
        penaltyConfig?: PenaltyConfig;
        revocable: boolean;
        poolBaseFee: bigint;
    };
    namespace LbeV2Parameters {
        function toLbeV2TreasuryDatum(networkId: NetworkId, lbeV2Parameters: LbeV2Parameters): TreasuryDatum;
    }
    type FactoryDatum = {
        head: string;
        tail: string;
    };
    namespace FactoryDatum {
        function toPlutusData(data: FactoryDatum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): FactoryDatum;
    }
    enum FactoryRedeemerType {
        INITIALIZATION = 0,
        CREATE_TREASURY = 1,
        CLOSE_TREASURY = 2,
        MINT_MANAGER = 3,
        MINT_SELLER = 4,
        BURN_SELLER = 5,
        MINT_ORDER = 6,
        MINT_REDEEM_ORDERS = 7,
        MANAGE_ORDER = 8
    }
    type FactoryRedeemer = {
        type: FactoryRedeemerType.INITIALIZATION | FactoryRedeemerType.MINT_MANAGER | FactoryRedeemerType.MINT_SELLER | FactoryRedeemerType.BURN_SELLER | FactoryRedeemerType.MINT_ORDER | FactoryRedeemerType.MINT_REDEEM_ORDERS | FactoryRedeemerType.MANAGE_ORDER;
    } | {
        type: FactoryRedeemerType.CREATE_TREASURY | FactoryRedeemerType.CLOSE_TREASURY;
        baseAsset: Asset;
        raiseAsset: Asset;
    };
    namespace FactoryRedeemer {
        function toPlutusData(data: FactoryRedeemer): Constr<DataType>;
    }
    class FactoryState {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: FactoryDatum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get head(): string;
        get tail(): string;
    }
    type ManagerDatum = {
        factoryPolicyId: string;
        baseAsset: Asset;
        raiseAsset: Asset;
        sellerCount: bigint;
        reserveRaise: bigint;
        totalPenalty: bigint;
    };
    namespace ManagerDatum {
        function toPlutusData(data: ManagerDatum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): ManagerDatum;
    }
    enum ManagerRedeemer {
        ADD_SELLERS = 0,
        COLLECT_SELLERS = 1,
        SPEND_MANAGER = 2
    }
    namespace ManagerRedeemer {
        function toPlutusData(data: ManagerRedeemer): Constr<DataType>;
    }
    class ManagerState {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: ManagerDatum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get lbeId(): string;
    }
    type SellerDatum = {
        factoryPolicyId: string;
        owner: string;
        baseAsset: Asset;
        raiseAsset: Asset;
        amount: bigint;
        penaltyAmount: bigint;
    };
    namespace SellerDatum {
        function toPlutusData(data: SellerDatum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>, networkId: NetworkId): SellerDatum;
    }
    enum SellerRedeemer {
        USING_SELLER = 0,
        COUNTING_SELLERS = 1
    }
    namespace SellerRedeemer {
        function toPlutusData(data: SellerRedeemer): Constr<DataType>;
    }
    class SellerState {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: SellerDatum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get lbeId(): string;
    }
    type OrderDatum = {
        factoryPolicyId: string;
        baseAsset: Asset;
        raiseAsset: Asset;
        owner: string;
        amount: bigint;
        isCollected: boolean;
        penaltyAmount: bigint;
    };
    namespace OrderDatum {
        function toPlutusData(data: OrderDatum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>, networkId: NetworkId): OrderDatum;
    }
    enum OrderRedeemer {
        UPDATE_ORDER = 0,
        COLLECT_ORDER = 1,
        REDEEM_ORDER = 2
    }
    namespace OrderRedeemer {
        function toPlutusData(data: OrderRedeemer): Constr<DataType>;
    }
    class OrderState {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: OrderDatum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get lbeId(): string;
        get owner(): string;
    }
}

declare namespace DexV1Constant {
    const ORDER_BASE_ADDRESS: Record<number, string>;
    const POOL_SCRIPT_HASH = "script1uychk9f04tqngfhx4qlqdlug5ntzen3uzc62kzj7cyesjk0d9me";
    const FACTORY_POLICY_ID = "13aa2accf2e1561723aa26871e071fdf32c867cff7e7d50ad470d62f";
    const FACTORY_ASSET_NAME = "4d494e53574150";
    const LP_POLICY_ID = "e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86";
    const POOL_NFT_POLICY_ID = "0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1";
    const ORDER_SCRIPT: Script;
}
declare namespace StableswapConstant {
    type Config = {
        orderAddress: string;
        poolAddress: string;
        nftAsset: string;
        lpAsset: string;
        assets: string[];
        multiples: bigint[];
        fee: bigint;
        adminFee: bigint;
        feeDenominator: bigint;
    };
    type DeployedScripts = {
        order: OutRef;
        pool: OutRef;
        lp: OutRef;
        poolBatching: OutRef;
    };
    const CONFIG: Record<NetworkId, Config[]>;
    const DEPLOYED_SCRIPTS: Record<NetworkId, Record<string, DeployedScripts>>;
    function getConfigByLpAsset(lpAsset: Asset, networkId: NetworkId): StableswapConstant.Config;
    function getConfigFromStableswapOrderAddress(address: string, networkId: NetworkId): StableswapConstant.Config;
    function getStableswapReferencesScript(nftAsset: Asset, networkId: NetworkId): StableswapConstant.DeployedScripts;
}
declare namespace DexV2Constant {
    const DEFAULT_CANCEL_TIPS = 300000n;
    const MIN_TRADING_FEE: bigint;
    const MAX_TRADING_FEE: bigint;
    type Config = {
        factoryAsset: string;
        poolAuthenAsset: string;
        globalSettingAsset: string;
        lpPolicyId: string;
        globalSettingScriptHash: string;
        globalSettingScriptHashBech32: string;
        orderScriptHash: string;
        orderScriptHashBech32: string;
        poolScriptHash: string;
        poolScriptHashBech32: string;
        poolCreationAddress: string;
        factoryScriptHashBech32: string;
        factoryScriptHash: string;
        factoryAddress: string;
        expiredOrderCancelAddress: string;
        poolBatchingAddress: string;
        orderEnterpriseAddress: string;
    };
    type DeployedScripts = {
        order: OutRef;
        pool: OutRef;
        factory: OutRef;
        authen: OutRef;
        poolBatching: OutRef;
        expiredOrderCancellation: OutRef;
    };
    const CONFIG: Record<NetworkId, Config>;
    const DEPLOYED_SCRIPTS: Record<NetworkId, DeployedScripts>;
}
declare namespace LbeV2Constant {
    const FACTORY_AUTH_AN = "666163746f7279";
    const TREASURY_AUTH_AN = "7472656173757279";
    const MANAGER_AUTH_AN = "4d616e61676572";
    const SELLER_AUTH_AN = "73656c6c6572";
    const ORDER_AUTH_AN = "6f72646572";
    const ORDER_COMMISSION = 250000n;
    const COLLECT_SELLER_COMMISSION = 250000n;
    const SELLER_COMMISSION = 1500000n;
    const CREATE_POOL_COMMISSION = 10000000n;
    const TREASURY_MIN_ADA = 5000000n;
    const MANAGER_MIN_ADA = 2500000n;
    const SELLER_MIN_ADA = 2500000n;
    const ORDER_MIN_ADA = 2500000n;
    const MIN_POOL_ALLOCATION_POINT = 70n;
    const MAX_POOL_ALLOCATION_POINT = 100n;
    const MAX_PENALTY_RATE = 25n;
    const MINIMUM_SELLER_COLLECTED = 20;
    const MINIMUM_ORDER_COLLECTED = 30;
    const MINIMUM_ORDER_REDEEMED = 30;
    const MAX_DISCOVERY_RANGE = 2592000000n;
    const MAX_PENALTY_RANGE = 172800000n;
    const DEFAULT_SELLER_COUNT = 20n;
    type Config = {
        factoryAsset: string;
        factoryHash: string;
        factoryHashBech32: string;
        factoryAddress: string;
        factoryRewardAddress: string;
        treasuryAsset: string;
        treasuryHash: string;
        treasuryHashBech32: string;
        treasuryAddress: string;
        managerAsset: string;
        managerHash: string;
        managerHashBech32: string;
        managerAddress: string;
        sellerAsset: string;
        sellerHash: string;
        sellerHashBech32: string;
        sellerAddress: string;
        orderAsset: string;
        orderHash: string;
        orderHashBech32: string;
        orderAddress: string;
    };
    type DeployedScripts = {
        factory: OutRef;
        treasury: OutRef;
        manager: OutRef;
        seller: OutRef;
        order: OutRef;
    };
    const CONFIG: Record<NetworkId, Config>;
    const DEPLOYED_SCRIPTS: Record<NetworkId, DeployedScripts>;
}
declare enum MetadataMessage {
    DEPOSIT_ORDER = "SDK Minswap: Deposit Order",
    CANCEL_ORDER = "SDK Minswap: Cancel Order",
    CANCEL_ORDERS_AUTOMATICALLY = "SDK Minswap: Cancel Orders Automatically",
    ZAP_IN_ORDER = "SDK Minswap: Zap Order",
    ZAP_OUT_ORDER = "SDK Minswap: Zap Out Order",
    SWAP_EXACT_IN_ORDER = "SDK Minswap: Swap Exact In Order",
    SWAP_EXACT_IN_LIMIT_ORDER = "SDK Minswap: Swap Exact In Limit Order",
    SWAP_EXACT_OUT_ORDER = "SDK Minswap: Swap Exact Out Order",
    WITHDRAW_ORDER = "SDK Minswap: Withdraw Order",
    STOP_ORDER = "SDK Minswap: Stop Order",
    OCO_ORDER = "SDK Minswap: OCO Order",
    ROUTING_ORDER = "SDK Minswap: Routing Order",
    PARTIAL_SWAP_ORDER = "SDK Minswap: Partial Fill Order",
    DONATION_ORDER = "SDK Minswap: Donation Order",
    MIXED_ORDERS = "SDK Minswap: Mixed Orders",
    CREATE_POOL = "SDK Minswap: Create Pool",
    CREATE_EVENT = "SDK Minswap: Create Event",
    UPDATE_EVENT = "SDK Minswap: Update Event",
    CANCEL_EVENT_BY_OWNER = "SDK Minswap: Cancel Event By Onwer",
    CANCEL_EVENT_BY_WORKER = "SDK Minswap: Cancel Event By Worker",
    LBE_V2_DEPOSIT_ORDER_EVENT = "SDK Minswap: Deposit Lbe V2 Order",
    LBE_V2_WITHDRAW_ORDER_EVENT = "SDK Minswap: Withdraw Lbe V2 Order",
    CLOSE_EVENT = "SDK Minswap: Close Event",
    LBE_V2_ADD_SELLERS = "SDK Minswap: Lbe V2 add more sellers",
    LBE_V2_COUNTING_SELLERS = "SDK Minswap: Lbe V2 counting sellers",
    LBE_V2_COLLECT_MANAGER = "SDK Minswap: Lbe V2 collect manager",
    LBE_V2_COLLECT_ORDER = "SDK Minswap: Lbe V2 collect order",
    LBE_V2_REDEEM_LP = "SDK Minswap: Lbe V2 redeem lp",
    LBE_V2_REFUND = "SDK Minswap: Lbe V2 refund",
    LBE_V2_CREATE_AMM_POOL = "SDK Minswap: Lbe V2 create AMM pool",
    DAO_POOL_FEE_UPDATE = "Minswap: Request of Pool Fee Manager"
}
declare const FIXED_DEPOSIT_ADA = 2000000n;
declare const SECURITY_PARAM: Record<NetworkEnvironment, number>;

type PoolFeeSharing = {
    feeTo: string;
    feeToDatumHash?: string;
};
declare namespace PoolFeeSharing {
    function toPlutusData(feeSharing: PoolFeeSharing): Constr<Constr<DataType>>;
    function fromPlutusData(networkId: NetworkId, data: Constr<DataType>): PoolFeeSharing;
}

declare const DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR = 10000n;
declare const MIN_POOL_V2_TRADING_FEE_NUMERATOR = 5n;
declare const MAX_POOL_V2_TRADING_FEE_NUMERATOR = 2000n;
declare namespace PoolV1 {
    /**
     * Represents state of a pool UTxO. The state could be latest state or a historical state.
     */
    class State {
        /** The transaction hash and output index of the pool UTxO */
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumHash: string;
        readonly assetA: string;
        readonly assetB: string;
        constructor(address: string, txIn: TxIn, value: Value, datumHash: string);
        get nft(): string;
        get id(): string;
        get assetLP(): string;
        get reserveA(): bigint;
        get reserveB(): bigint;
    }
    type Datum = {
        assetA: Asset;
        assetB: Asset;
        totalLiquidity: bigint;
        rootKLast: bigint;
        feeSharing?: PoolFeeSharing;
    };
    namespace Datum {
        function toPlutusData(datum: Datum): Constr<DataType>;
        function fromPlutusData(networkId: NetworkId, data: Constr<DataType>): Datum;
    }
}
declare namespace StablePool {
    class State {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: Datum;
        readonly config: StableswapConstant.Config;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get assets(): string[];
        get nft(): string;
        get lpAsset(): string;
        get reserves(): bigint[];
        get totalLiquidity(): bigint;
        get orderHash(): string;
        get amp(): bigint;
        get id(): string;
    }
    type Datum = {
        balances: bigint[];
        totalLiquidity: bigint;
        amplificationCoefficient: bigint;
        orderHash: string;
    };
    namespace Datum {
        function toPlutusData(datum: Datum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): Datum;
    }
}
declare namespace PoolV2 {
    const MAX_LIQUIDITY = 9223372036854775807n;
    const DEFAULT_POOL_ADA = 4500000n;
    const MINIMUM_LIQUIDITY = 10n;
    const DEFAULT_TRADING_FEE_DENOMINATOR = 10000n;
    function computeLPAssetName(assetA: Asset, assetB: Asset): string;
    type Info = {
        datumReserves: [bigint, bigint];
        valueReserves: [bigint, bigint];
        totalLiquidity: bigint;
        tradingFee: {
            feeANumerator: bigint;
            feeBNumerator: bigint;
        };
        feeSharingNumerator?: bigint;
    };
    class State {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumRaw: string;
        readonly datum: Datum;
        readonly config: DexV2Constant.Config;
        readonly lpAsset: Asset;
        readonly authenAsset: Asset;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
        get assetA(): string;
        get assetB(): string;
        get totalLiquidity(): bigint;
        get reserveA(): bigint;
        get reserveB(): bigint;
        get feeA(): [bigint, bigint];
        get feeB(): [bigint, bigint];
        get feeShare(): [bigint, bigint] | undefined;
        get datumReserves(): [bigint, bigint];
        get valueReserveA(): bigint;
        get valueReserveB(): bigint;
        get valueReserves(): [bigint, bigint];
        get info(): Info;
    }
    type Datum = {
        poolBatchingStakeCredential: Credential;
        assetA: Asset;
        assetB: Asset;
        totalLiquidity: bigint;
        reserveA: bigint;
        reserveB: bigint;
        baseFee: {
            feeANumerator: bigint;
            feeBNumerator: bigint;
        };
        feeSharingNumerator?: bigint;
        allowDynamicFee: boolean;
    };
    namespace Datum {
        function toPlutusData(datum: Datum): Constr<DataType>;
        function fromPlutusData(data: Constr<DataType>): Datum;
    }
}

type PaginationByPage = {
    page?: number;
    count?: number;
    order?: "asc" | "desc";
};
type PaginationByCursor = {
    cursor?: string;
    count?: number;
    order?: "asc" | "desc";
};
type Pagination = PaginationByPage | PaginationByCursor;
type GetPoolByIdParams = {
    id: string;
};
type GetPoolInTxParams = {
    txHash: string;
};
type GetPoolPriceParams = {
    pool: PoolV1.State;
    decimalsA?: number;
    decimalsB?: number;
};
type GetStablePoolPriceParams = {
    pool: StablePool.State;
    assetAIndex: number;
    assetBIndex: number;
};
type GetV1PoolHistoryParams = {
    id: string;
};
type GetV2PoolPriceParams = {
    pool: PoolV2.State;
    decimalsA?: number;
    decimalsB?: number;
};
interface Adapter {
    getAssetDecimals(asset: string): Promise<number>;
    getDatumByDatumHash(datumHash: string): Promise<string>;
    currentSlot(): Promise<number>;
    /**
     * Get pool state in a transaction.
     * @param {Object} params - The parameters.
     * @param {string} params.txHash - The transaction hash containing pool output. One of the way to acquire is by calling getPoolHistory.
     * @returns {PoolV1.State} - Returns the pool state or null if the transaction doesn't contain pool.
     */
    getV1PoolInTx({ txHash }: GetPoolInTxParams): Promise<PoolV1.State | null>;
    /**
     * Get a specific pool by its ID.
     * @param {Object} params - The parameters.
     * @param {string} params.pool - The pool ID. This is the asset name of a pool's NFT and LP tokens. It can also be acquired by calling pool.id.
     * @returns {PoolV1.State | null} - Returns the pool or null if not found.
     */
    getV1PoolById({ id }: GetPoolByIdParams): Promise<PoolV1.State | null>;
    /**
     * @returns The latest pools or empty array if current page is after last page
     */
    getV1Pools(pagination: Pagination): Promise<PoolV1.State[]>;
    getV1PoolHistory(pagination: Pagination, params: GetV1PoolHistoryParams): Promise<TxHistory[]>;
    /**
     * Get pool price.
     * @param {Object} params - The parameters to calculate pool price.
     * @param {string} params.pool - The pool we want to get price.
     * @param {string} [params.decimalsA] - The decimals of assetA in pool, if undefined then query from the adapter.
     * @param {string} [params.decimalsB] - The decimals of assetB in pool, if undefined then query from the adapter.
     * @returns {[string, string]} - Returns a pair of asset A/B price and B/A price, adjusted to decimals.
     */
    getV1PoolPrice(params: GetPoolPriceParams): Promise<[Big, Big]>;
    getAllV2Pools(): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2Pools(pagination: Pagination): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2PoolByPair(assetA: Asset, assetB: Asset): Promise<PoolV2.State | null>;
    getV2PoolByLp(lpAsset: Asset): Promise<PoolV2.State | null>;
    /**
     * Get pool price.
     * @param {Object} params - The parameters to calculate pool price.
     * @param {string} params.pool - The pool we want to get price.
     * @param {string} [params.decimalsA] - The decimals of assetA in pool, if undefined then query from the adapter.
     * @param {string} [params.decimalsB] - The decimals of assetB in pool, if undefined then query from the adapter.
     * @returns {[string, string]} - Returns a pair of asset A/B price and B/A price, adjusted to decimals.
     */
    getV2PoolPrice(params: GetV2PoolPriceParams): Promise<[Big, Big]>;
    getAllFactoriesV2(): Promise<{
        factories: FactoryV2.State[];
        errors: unknown[];
    }>;
    getFactoryV2ByPair(assetA: Asset, assetB: Asset): Promise<FactoryV2.State | null>;
    getAllStablePools(): Promise<{
        pools: StablePool.State[];
        errors: unknown[];
    }>;
    getStablePoolByLpAsset(lpAsset: Asset): Promise<StablePool.State | null>;
    getStablePoolByNFT(nft: Asset): Promise<StablePool.State | null>;
    /**
     * Get stable pool price.
     *
     * A Stable Pool can contain more than two assets, so we need to specify which assets we want to retrieve the price against by using assetAIndex and assetBIndex.
     * @param {Object} params - The parameters to calculate pool price.
     * @param {string} params.pool - The pool we want to get price.
     * @param {number} params.assetAIndex
     * @param {number} params.assetBIndex
     * @returns {[string, string]} - Returns price of @assetA agains @assetB
     */
    getStablePoolPrice(params: GetStablePoolPriceParams): Big;
    getAllLbeV2Factories(): Promise<{
        factories: LbeV2Types.FactoryState[];
        errors: unknown[];
    }>;
    getLbeV2Factory(baseAsset: Asset, raiseAsset: Asset): Promise<LbeV2Types.FactoryState | null>;
    getLbeV2HeadAndTailFactory(lbeId: string): Promise<{
        head: LbeV2Types.FactoryState;
        tail: LbeV2Types.FactoryState;
    } | null>;
    getAllLbeV2Treasuries(): Promise<{
        treasuries: LbeV2Types.TreasuryState[];
        errors: unknown[];
    }>;
    getLbeV2TreasuryByLbeId(lbeId: string): Promise<LbeV2Types.TreasuryState | null>;
    getAllLbeV2Managers(): Promise<{
        managers: LbeV2Types.ManagerState[];
        errors: unknown[];
    }>;
    getLbeV2ManagerByLbeId(lbeId: string): Promise<LbeV2Types.ManagerState | null>;
    getAllLbeV2Sellers(): Promise<{
        sellers: LbeV2Types.SellerState[];
        errors: unknown[];
    }>;
    getLbeV2SellerByLbeId(lbeId: string): Promise<LbeV2Types.SellerState | null>;
    getAllLbeV2Orders(): Promise<{
        orders: LbeV2Types.OrderState[];
        errors: unknown[];
    }>;
    getLbeV2OrdersByLbeId(lbeId: string): Promise<LbeV2Types.OrderState[]>;
    getLbeV2OrdersByLbeIdAndOwner(lbeId: string, owner: string): Promise<LbeV2Types.OrderState[]>;
}

declare namespace OrderV1 {
    enum StepType {
        SWAP_EXACT_IN = 0,
        SWAP_EXACT_OUT = 1,
        DEPOSIT = 2,
        WITHDRAW = 3,
        ZAP_IN = 4
    }
    type SwapExactIn = {
        type: StepType.SWAP_EXACT_IN;
        desiredAsset: Asset;
        minimumReceived: bigint;
    };
    type SwapExactOut = {
        type: StepType.SWAP_EXACT_OUT;
        desiredAsset: Asset;
        expectedReceived: bigint;
    };
    type Deposit = {
        type: StepType.DEPOSIT;
        minimumLP: bigint;
    };
    type Withdraw = {
        type: StepType.WITHDRAW;
        minimumAssetA: bigint;
        minimumAssetB: bigint;
    };
    type ZapIn = {
        type: StepType.ZAP_IN;
        desiredAsset: Asset;
        minimumLP: bigint;
    };
    type Step = SwapExactIn | SwapExactOut | Deposit | Withdraw | ZapIn;
    type Datum = {
        sender: string;
        receiver: string;
        receiverDatumHash?: string;
        step: Step;
        batcherFee: bigint;
        depositADA: bigint;
    };
    namespace Datum {
        function toPlutusData(datum: Datum): Constr<DataType>;
        function fromPlutusData(networkId: NetworkId, data: Constr<DataType>): Datum;
    }
    enum Redeemer {
        APPLY_ORDER = 0,
        CANCEL_ORDER = 1
    }
}
declare namespace StableOrder {
    enum StepType {
        SWAP = 0,
        DEPOSIT = 1,
        WITHDRAW = 2,
        WITHDRAW_IMBALANCE = 3,
        ZAP_OUT = 4
    }
    type SwapStep = {
        type: StepType.SWAP;
        assetInIndex: bigint;
        assetOutIndex: bigint;
        minimumAssetOut: bigint;
    };
    type DepositStep = {
        type: StepType.DEPOSIT;
        minimumLP: bigint;
    };
    type WithdrawStep = {
        type: StepType.WITHDRAW;
        minimumAmounts: bigint[];
    };
    type WithdrawImbalanceStep = {
        type: StepType.WITHDRAW_IMBALANCE;
        withdrawAmounts: bigint[];
    };
    type ZapOutStep = {
        type: StepType.ZAP_OUT;
        assetOutIndex: bigint;
        minimumAssetOut: bigint;
    };
    type Step = SwapStep | DepositStep | WithdrawStep | WithdrawImbalanceStep | ZapOutStep;
    type Datum = {
        sender: string;
        receiver: string;
        receiverDatumHash?: string;
        step: Step;
        batcherFee: bigint;
        depositADA: bigint;
    };
    namespace Datum {
        function toPlutusData(datum: Datum): Constr<DataType>;
        function fromPlutusData(networkId: NetworkId, data: Constr<DataType>): Datum;
    }
    enum Redeemer {
        APPLY_ORDER = 0,
        CANCEL_ORDER = 1
    }
}
declare namespace OrderV2 {
    enum AuthorizationMethodType {
        SIGNATURE = 0,
        SPEND_SCRIPT = 1,
        WITHDRAW_SCRIPT = 2,
        MINT_SCRIPT = 3
    }
    type AuthorizationMethod = {
        type: AuthorizationMethodType;
        hash: string;
    };
    namespace AuthorizationMethod {
        function fromPlutusData(data: Constr<DataType>): AuthorizationMethod;
        function toPlutusData(method: AuthorizationMethod): Constr<DataType>;
    }
    enum Direction {
        B_TO_A = 0,
        A_TO_B = 1
    }
    namespace Direction {
        function fromPlutusData(data: Constr<DataType>): Direction;
        function toPlutusData(direction: Direction): Constr<DataType>;
    }
    enum Killable {
        PENDING_ON_FAILED = 0,
        KILL_ON_FAILED = 1
    }
    namespace Killable {
        function fromPlutusData(data: Constr<DataType>): Killable;
        function toPlutusData(killable: Killable): Constr<DataType>;
    }
    enum AmountType {
        SPECIFIC_AMOUNT = 0,
        ALL = 1
    }
    type DepositAmount = {
        type: AmountType.SPECIFIC_AMOUNT;
        depositAmountA: bigint;
        depositAmountB: bigint;
    } | {
        type: AmountType.ALL;
        deductedAmountA: bigint;
        deductedAmountB: bigint;
    };
    namespace DepositAmount {
        function fromPlutusData(data: Constr<DataType>): DepositAmount;
        function toPlutusData(amount: DepositAmount): Constr<DataType>;
    }
    type SwapAmount = {
        type: AmountType.SPECIFIC_AMOUNT;
        swapAmount: bigint;
    } | {
        type: AmountType.ALL;
        deductedAmount: bigint;
    };
    namespace SwapAmount {
        function fromPlutusData(data: Constr<DataType>): SwapAmount;
        function toPlutusData(amount: SwapAmount): Constr<DataType>;
    }
    type WithdrawAmount = {
        type: AmountType.SPECIFIC_AMOUNT;
        withdrawalLPAmount: bigint;
    } | {
        type: AmountType.ALL;
        deductedLPAmount: bigint;
    };
    namespace WithdrawAmount {
        function fromPlutusData(data: Constr<DataType>): WithdrawAmount;
        function toPlutusData(amount: WithdrawAmount): Constr<DataType>;
    }
    type Route = {
        lpAsset: Asset;
        direction: Direction;
    };
    namespace Route {
        function fromPlutusData(data: Constr<DataType>): Route;
        function toPlutusData(route: Route): Constr<DataType>;
    }
    enum StepType {
        SWAP_EXACT_IN = 0,
        STOP = 1,
        OCO = 2,
        SWAP_EXACT_OUT = 3,
        DEPOSIT = 4,
        WITHDRAW = 5,
        ZAP_OUT = 6,
        PARTIAL_SWAP = 7,
        WITHDRAW_IMBALANCE = 8,
        SWAP_ROUTING = 9,
        DONATION = 10
    }
    type SwapExactIn = {
        type: StepType.SWAP_EXACT_IN;
        direction: Direction;
        swapAmount: SwapAmount;
        minimumReceived: bigint;
        killable: Killable;
    };
    type Stop = {
        type: StepType.STOP;
        direction: Direction;
        swapAmount: SwapAmount;
        stopReceived: bigint;
    };
    type OCO = {
        type: StepType.OCO;
        direction: Direction;
        swapAmount: SwapAmount;
        minimumReceived: bigint;
        stopReceived: bigint;
    };
    type SwapExactOut = {
        type: StepType.SWAP_EXACT_OUT;
        direction: Direction;
        maximumSwapAmount: SwapAmount;
        expectedReceived: bigint;
        killable: Killable;
    };
    type Deposit = {
        type: StepType.DEPOSIT;
        depositAmount: DepositAmount;
        minimumLP: bigint;
        killable: Killable;
    };
    type Withdraw = {
        type: StepType.WITHDRAW;
        withdrawalAmount: WithdrawAmount;
        minimumAssetA: bigint;
        minimumAssetB: bigint;
        killable: Killable;
    };
    type ZapOut = {
        type: StepType.ZAP_OUT;
        direction: Direction;
        withdrawalAmount: WithdrawAmount;
        minimumReceived: bigint;
        killable: Killable;
    };
    type PartialSwap = {
        type: StepType.PARTIAL_SWAP;
        direction: Direction;
        totalSwapAmount: bigint;
        ioRatioNumerator: bigint;
        ioRatioDenominator: bigint;
        hops: bigint;
        minimumSwapAmountRequired: bigint;
        maxBatcherFeeEachTime: bigint;
    };
    type WithdrawImbalance = {
        type: StepType.WITHDRAW_IMBALANCE;
        withdrawalAmount: WithdrawAmount;
        ratioAssetA: bigint;
        ratioAssetB: bigint;
        minimumAssetA: bigint;
        killable: Killable;
    };
    type SwapRouting = {
        type: StepType.SWAP_ROUTING;
        routings: Route[];
        swapAmount: SwapAmount;
        minimumReceived: bigint;
    };
    type Donation = {
        type: StepType.DONATION;
    };
    type Step = SwapExactIn | Stop | OCO | SwapExactOut | Deposit | Withdraw | ZapOut | PartialSwap | WithdrawImbalance | SwapRouting | Donation;
    namespace Step {
        function fromPlutusData(data: Constr<DataType>): Step;
        function toPlutusData(step: Step): Constr<DataType>;
    }
    type ExpirySetting = {
        expiredTime: bigint;
        maxCancellationTip: bigint;
    };
    enum ExtraDatumType {
        NO_DATUM = 0,
        DATUM_HASH = 1,
        INLINE_DATUM = 2
    }
    type ExtraDatum = {
        type: ExtraDatumType.NO_DATUM;
    } | {
        type: ExtraDatumType.DATUM_HASH | ExtraDatumType.INLINE_DATUM;
        hash: string;
    };
    namespace ExtraDatum {
        function fromPlutusData(data: Constr<DataType>): ExtraDatum;
        function toPlutusData(extraDatum: ExtraDatum): Constr<DataType>;
    }
    type Datum = {
        canceller: AuthorizationMethod;
        refundReceiver: string;
        refundReceiverDatum: ExtraDatum;
        successReceiver: string;
        successReceiverDatum: ExtraDatum;
        lpAsset: Asset;
        step: Step;
        maxBatcherFee: bigint;
        expiredOptions?: ExpirySetting;
    };
    namespace Datum {
        function fromPlutusData(networkId: NetworkId, data: Constr<DataType>): Datum;
        function toPlutusData(datum: Datum): Constr<DataType>;
    }
    enum Redeemer {
        APPLY_ORDER = 0,
        CANCEL_ORDER_BY_OWNER = 1,
        CANCEL_EXPIRED_ORDER_BY_ANYONE = 2
    }
    class State {
        readonly address: string;
        readonly txIn: TxIn;
        readonly value: Value;
        readonly datumCbor: string;
        readonly datum: Datum;
        constructor(networkId: NetworkId, address: string, txIn: TxIn, value: Value, datum: string);
    }
}

declare class BlockfrostAdapter implements Adapter {
    protected readonly networkId: NetworkId;
    private readonly blockFrostApi;
    constructor(networkId: NetworkId, blockFrostApi: BlockFrostAPI);
    getAssetDecimals(asset: string): Promise<number>;
    getDatumByDatumHash(datumHash: string): Promise<string>;
    currentSlot(): Promise<number>;
    getV1PoolInTx({ txHash, }: GetPoolInTxParams): Promise<PoolV1.State | null>;
    getV1PoolById({ id, }: GetPoolByIdParams): Promise<PoolV1.State | null>;
    getV1Pools({ page, count, order, }: PaginationByPage): Promise<PoolV1.State[]>;
    getV1PoolHistory({ page, count, order }: PaginationByPage, { id }: GetV1PoolHistoryParams): Promise<TxHistory[]>;
    getV1PoolPrice({ pool, decimalsA, decimalsB, }: GetPoolPriceParams): Promise<[Big, Big]>;
    getAllV2Pools(): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2Pools({ page, count, order, }: PaginationByPage): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2PoolByPair(assetA: Asset, assetB: Asset): Promise<PoolV2.State | null>;
    getV2PoolByLp(lpAsset: Asset): Promise<PoolV2.State | null>;
    getV2PoolPrice({ pool, decimalsA, decimalsB, }: GetV2PoolPriceParams): Promise<[Big, Big]>;
    getAllFactoriesV2(): Promise<{
        factories: FactoryV2.State[];
        errors: unknown[];
    }>;
    getFactoryV2ByPair(assetA: Asset, assetB: Asset): Promise<FactoryV2.State | null>;
    getAllV2Orders(): Promise<{
        orders: OrderV2.State[];
        errors: unknown[];
    }>;
    private parseStablePoolState;
    getAllStablePools(): Promise<{
        pools: StablePool.State[];
        errors: unknown[];
    }>;
    getStablePoolByLpAsset(lpAsset: Asset): Promise<StablePool.State | null>;
    getStablePoolByNFT(nft: Asset): Promise<StablePool.State | null>;
    getStablePoolPrice({ pool, assetAIndex, assetBIndex, }: GetStablePoolPriceParams): Big;
    getAllLbeV2Factories(): Promise<{
        factories: LbeV2Types.FactoryState[];
        errors: unknown[];
    }>;
    getLbeV2Factory(baseAsset: Asset, raiseAsset: Asset): Promise<LbeV2Types.FactoryState | null>;
    getLbeV2HeadAndTailFactory(lbeId: string): Promise<{
        head: LbeV2Types.FactoryState;
        tail: LbeV2Types.FactoryState;
    } | null>;
    getAllLbeV2Treasuries(): Promise<{
        treasuries: LbeV2Types.TreasuryState[];
        errors: unknown[];
    }>;
    getLbeV2TreasuryByLbeId(lbeId: string): Promise<LbeV2Types.TreasuryState | null>;
    getAllLbeV2Managers(): Promise<{
        managers: LbeV2Types.ManagerState[];
        errors: unknown[];
    }>;
    getLbeV2ManagerByLbeId(lbeId: string): Promise<LbeV2Types.ManagerState | null>;
    getAllLbeV2Sellers(): Promise<{
        sellers: LbeV2Types.SellerState[];
        errors: unknown[];
    }>;
    getLbeV2SellerByLbeId(lbeId: string): Promise<LbeV2Types.SellerState | null>;
    getAllLbeV2Orders(): Promise<{
        orders: LbeV2Types.OrderState[];
        errors: unknown[];
    }>;
    getLbeV2OrdersByLbeId(lbeId: string): Promise<LbeV2Types.OrderState[]>;
    getLbeV2OrdersByLbeIdAndOwner(lbeId: string, owner: string): Promise<LbeV2Types.OrderState[]>;
}

declare class MaestroServerError {
    code: number;
    error: string;
    message: string;
}
declare class MaestroAdapter implements Adapter {
    protected readonly networkId: NetworkId;
    private readonly maestroClient;
    constructor(networkId: NetworkId, maestroClient: MaestroClient);
    private mapMaestroAssetToValue;
    private getAllUtxosDataByPaymentCred;
    getAssetDecimals(asset: string): Promise<number>;
    getDatumByDatumHash(datumHash: string): Promise<string>;
    currentSlot(): Promise<number>;
    getV1PoolInTx({ txHash, }: GetPoolInTxParams): Promise<PoolV1.State | null>;
    getV1PoolById({ id, }: GetPoolByIdParams): Promise<PoolV1.State | null>;
    getV1Pools({ cursor, count, order, }: PaginationByCursor): Promise<PoolV1.State[]>;
    getV1PoolHistory({ cursor, count, order }: PaginationByCursor, { id }: GetV1PoolHistoryParams): Promise<TxHistory[]>;
    getV1PoolPrice({ pool, decimalsA, decimalsB, }: GetPoolPriceParams): Promise<[Big, Big]>;
    getAllV2Pools(): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2Pools({ cursor, count, order, }: PaginationByCursor): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2PoolByPair(assetA: Asset, assetB: Asset): Promise<PoolV2.State | null>;
    getV2PoolByLp(lpAsset: Asset): Promise<PoolV2.State | null>;
    getV2PoolPrice({ pool, decimalsA, decimalsB, }: GetV2PoolPriceParams): Promise<[Big, Big]>;
    getAllFactoriesV2(): Promise<{
        factories: FactoryV2.State[];
        errors: unknown[];
    }>;
    getFactoryV2ByPair(assetA: Asset, assetB: Asset): Promise<FactoryV2.State | null>;
    getAllV2Orders(): Promise<{
        orders: OrderV2.State[];
        errors: unknown[];
    }>;
    private parseStablePoolState;
    getAllStablePools(): Promise<{
        pools: StablePool.State[];
        errors: unknown[];
    }>;
    getStablePoolByLpAsset(lpAsset: Asset): Promise<StablePool.State | null>;
    getStablePoolByNFT(nft: Asset): Promise<StablePool.State | null>;
    getStablePoolPrice({ pool, assetAIndex, assetBIndex, }: GetStablePoolPriceParams): Big;
    getAllLbeV2Factories(): Promise<{
        factories: LbeV2Types.FactoryState[];
        errors: unknown[];
    }>;
    getLbeV2Factory(baseAsset: Asset, raiseAsset: Asset): Promise<LbeV2Types.FactoryState | null>;
    getLbeV2HeadAndTailFactory(lbeId: string): Promise<{
        head: LbeV2Types.FactoryState;
        tail: LbeV2Types.FactoryState;
    } | null>;
    getAllLbeV2Treasuries(): Promise<{
        treasuries: LbeV2Types.TreasuryState[];
        errors: unknown[];
    }>;
    getLbeV2TreasuryByLbeId(lbeId: string): Promise<LbeV2Types.TreasuryState | null>;
    getAllLbeV2Managers(): Promise<{
        managers: LbeV2Types.ManagerState[];
        errors: unknown[];
    }>;
    getLbeV2ManagerByLbeId(lbeId: string): Promise<LbeV2Types.ManagerState | null>;
    getAllLbeV2Sellers(): Promise<{
        sellers: LbeV2Types.SellerState[];
        errors: unknown[];
    }>;
    getLbeV2SellerByLbeId(lbeId: string): Promise<LbeV2Types.SellerState | null>;
    getAllLbeV2Orders(): Promise<{
        orders: LbeV2Types.OrderState[];
        errors: unknown[];
    }>;
    getLbeV2OrdersByLbeId(lbeId: string): Promise<LbeV2Types.OrderState[]>;
    getLbeV2OrdersByLbeIdAndOwner(lbeId: string, owner: string): Promise<LbeV2Types.OrderState[]>;
}

type PrismaClientInTx = Omit<Prisma.PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
declare class PostgresRepositoryReader {
    protected readonly networkEnv: NetworkEnvironment;
    protected readonly prismaClientInTx: PrismaClientInTx;
    constructor(networkEnv: NetworkEnvironment, prismaClientInTx: PrismaClientInTx);
    getIntersectionCandidates(): Promise<OgmiosSchema.Point[]>;
    getPoolV1ByCreatedTxId(txId: string): Promise<Prisma.PoolV1 | null>;
    getPoolV1ByLpAsset(lpAsset: string): Promise<Prisma.PoolV1 | null>;
    getLastPoolV1State(offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.PoolV1[]>;
    getHistoricalPoolV1ByLpAsset(lpAsset: string, offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.PoolV1[]>;
    getHistoricalPoolsV1(offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.PoolV1[]>;
    getAllLastPoolV2State(): Promise<Prisma.PoolV2[]>;
    getLastPoolV2State(offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.PoolV2[]>;
    getHistoricalPoolV2ByLpAsset(lpAsset: string, offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.PoolV2[]>;
    getHistoricalPoolsV2(offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.PoolV2[]>;
    getPoolV2ByPair(assetA: Asset, assetB: Asset): Promise<Prisma.PoolV2 | null>;
    getPoolV2ByLpAsset(lpAsset: Asset): Promise<Prisma.PoolV2 | null>;
    getAllLastStablePoolState(): Promise<Prisma.StablePool[]>;
    getStablePoolByLpAsset(lpAsset: string): Promise<Prisma.StablePool | null>;
    getHistoricalStablePoolsByLpAsset(lpAsset: string, offset: number, limit: number, orderBy: "asc" | "desc"): Promise<Prisma.StablePool[]>;
}

type GetStablePoolHistoryParams = {
    lpAsset: Asset;
};
type GetV2PoolHistoryParams = {
    assetA: Asset;
    assetB: Asset;
} | {
    lpAsset: Asset;
};
type MinswapAdapterConstructor = {
    networkId: NetworkId;
    networkEnv: NetworkEnvironment;
    blockFrostApi: BlockFrostAPI;
    repository: PostgresRepositoryReader;
};
declare class MinswapAdapter extends BlockfrostAdapter {
    private readonly networkEnv;
    private readonly repository;
    constructor({ networkId, networkEnv, blockFrostApi, repository, }: MinswapAdapterConstructor);
    private prismaPoolV1ToPoolV1State;
    getV1PoolInTx({ txHash, }: GetPoolInTxParams): Promise<PoolV1.State | null>;
    getV1PoolById({ id, }: GetPoolByIdParams): Promise<PoolV1.State | null>;
    getV1Pools({ page, count, order, }: PaginationByPage): Promise<PoolV1.State[]>;
    getV1PoolHistory({ page, count, order }: PaginationByPage, { id }: GetV1PoolHistoryParams): Promise<TxHistory[]>;
    private prismaPoolV2ToPoolV2State;
    getAllV2Pools(): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2Pools({ page, count, order, }: PaginationByPage): Promise<{
        pools: PoolV2.State[];
        errors: unknown[];
    }>;
    getV2PoolByPair(assetA: Asset, assetB: Asset): Promise<PoolV2.State | null>;
    getV2PoolByLp(lpAsset: Asset): Promise<PoolV2.State | null>;
    getV2PoolHistory({ page, count, order }: PaginationByPage, params: GetV2PoolHistoryParams): Promise<PoolV2.State[]>;
    private prismaStablePoolToStablePoolState;
    getAllStablePools(): Promise<{
        pools: StablePool.State[];
        errors: unknown[];
    }>;
    getStablePoolByNFT(nft: Asset): Promise<StablePool.State | null>;
    getStablePoolByLpAsset(lpAsset: Asset): Promise<StablePool.State | null>;
    getStablePoolHistory({ page, count, order }: PaginationByPage, { lpAsset }: GetStablePoolHistoryParams): Promise<StablePool.State[]>;
}

/**
 * Options to calculate Amount Out & Price Impact while swapping exact in
 * @amountIn The amount that we want to swap from
 * @reserveIn The Reserve of Asset In in Liquidity Pool
 * @reserveOut The Reserve of Asset Out in Liquidity Pool
 */
type CalculateSwapExactInOptions = {
    amountIn: bigint;
    reserveIn: bigint;
    reserveOut: bigint;
};
/**
 * Calculate Amount Out & Price Impact while swapping exact in
 * @param options See @CalculateSwapExactInOptions description
 * @returns The amount of the other token that we get from the swap and its price impact
 */
declare function calculateSwapExactIn(options: CalculateSwapExactInOptions): {
    amountOut: bigint;
    priceImpact: Big;
};
/**
 * Options to calculate necessary Amount In & Price Impact to cover the @exactAmountOut while swapping exact out
 * @exactAmountOut The exact amount that we want to receive
 * @reserveIn The Reserve of Asset In in Liquidity Pool
 * @reserveOut The Reserve of Asset Out in Liquidity Pool
 */
type CalculateSwapExactOutOptions = {
    exactAmountOut: bigint;
    reserveIn: bigint;
    reserveOut: bigint;
};
/**
 * Calculate necessary Amount In & Price Impact to cover the @exactAmountOut while swapping exact out
 * @param options See @CalculateSwapExactOutOptions description
 * @returns The amount needed of the input token for the swap and its price impact
 */
declare function calculateSwapExactOut(options: CalculateSwapExactOutOptions): {
    amountIn: bigint;
    priceImpact: Big;
};
/**
 * Options to calculate amount with slippage tolerance up or down
 * @slippageTolerancePercent The slippage tolerance percent
 * @amount The amount that we want to calculate
 * @type The type of slippage tolerance, up or down
 */
type CalculateSwapExactOutWithSlippageToleranceOptions = {
    slippageTolerancePercent: number;
    amount: bigint;
    type: "up" | "down";
};
/**
 * Calculate result amount with slippage tolerance up or down
 * @param options See @CalculateSwapExactOutWithSlippageToleranceOptions description
 * @returns The amount needed of the input token for the swap and its price impact
 */
declare function calculateAmountWithSlippageTolerance(options: CalculateSwapExactOutWithSlippageToleranceOptions): bigint;
/**
 * Options to calculate LP Amount while depositing
 * @depositedAmountA Amount of Asset A you want to deposit
 * @depositedAmountB Amount of Asset B you want to deposit
 * @reserveA Reserve of Asset A in Liquidity Pool
 * @reserveB Reserve of Asset B in Liquidity Pool
 * @totalLiquidity Total Circulating of LP Token in Liquidity Pool
 */
type CalculateDepositOptions = {
    depositedAmountA: bigint;
    depositedAmountB: bigint;
    reserveA: bigint;
    reserveB: bigint;
    totalLiquidity: bigint;
};
/**
 * Calculate LP Amount while depositing
 * @param options See @CalculateDepositOptions description
 * @returns The amount needed of Asset A and Asset and LP Token Amount you will receive
 */
declare function calculateDeposit(options: CalculateDepositOptions): {
    necessaryAmountA: bigint;
    necessaryAmountB: bigint;
    lpAmount: bigint;
};
/**
 * Options to calculate amount A and amount B after withdrawing @withdrawalLPAmount out of Liquidity Pool
 * @withdrawalLPAmount LP Token amount you want to withdraw
 * @reserveA Reserve of Asset A in Liquidity Pool
 * @reserveB Reserve of Asset B in Liquidity Pool
 * @totalLiquidity Total Circulating of LP Token in Liquidity Pool
 */
type CalculateWithdrawOptions = {
    withdrawalLPAmount: bigint;
    reserveA: bigint;
    reserveB: bigint;
    totalLiquidity: bigint;
};
/**
 * Calculate amount A and amount B after withdrawing @withdrawalLPAmount out of Liquidity Pool
 * @param options See @CalculateWithdrawOptions description
 * @returns amount A and amount B you will receive
 */
declare function calculateWithdraw(options: CalculateWithdrawOptions): {
    amountAReceive: bigint;
    amountBReceive: bigint;
};
/**
 * Options to calculate LP Amount while zapping
 * @amountIn Amount you want to zap
 * @reserveIn Reserve of Asset which you want to zap in Liquidity Pool
 * @reserveOut Reserve of other Asset in Liquidity Pool
 * @totalLiquidity Total Circulating of LP Token in Liquidity Pool
 */
type CalculateZapInOptions = {
    amountIn: bigint;
    reserveIn: bigint;
    reserveOut: bigint;
    totalLiquidity: bigint;
};
/**
 * Calculate LP Amount while zapping
 * @param options See @CalculateZapInOptions description
 * @returns Amount of LP Token you will receive
 */
declare function calculateZapIn(options: CalculateZapInOptions): bigint;
type Reserves = [bigint, bigint];
type Fraction = [bigint, bigint];
declare namespace DexV2Calculation {
    type InitialLiquidityOptions = {
        amountA: bigint;
        amountB: bigint;
    };
    type CalculateAmountOutOptions = {
        reserveIn: bigint;
        reserveOut: bigint;
        amountIn: bigint;
        tradingFeeNumerator: bigint;
    };
    type CalculateAmountOutFractionOptions = {
        reserveIn: bigint;
        reserveOut: bigint;
        amountIn: Fraction;
        tradingFeeNumerator: bigint;
    };
    type CalculateAmountInOptions = {
        reserveIn: bigint;
        reserveOut: bigint;
        amountOut: bigint;
        tradingFeeNumerator: bigint;
    };
    type CalculateMaxInSwapOptions = {
        reserveIn: bigint;
        reserveOut: bigint;
        tradingFeeNumerator: bigint;
        ioRatio: Fraction;
    };
    type CalculateDepositAmountOptions = {
        amountA: bigint;
        amountB: bigint;
        poolInfo: PoolV2.Info;
    };
    type CalculateDepositSwapAmountOptions = {
        amountIn: bigint;
        amountOut: bigint;
        reserveIn: bigint;
        reserveOut: bigint;
        tradingFeeNumerator: bigint;
    };
    type CalculateWithdrawAmountOptions = {
        datumReserves: Reserves;
        withdrawalLPAmount: bigint;
        totalLiquidity: bigint;
    };
    type CalculateZapOutAmountOptions = {
        withdrawalLPAmount: bigint;
        direction: OrderV2.Direction;
        poolInfo: PoolV2.Info;
    };
    function bigIntPow(x: bigint): bigint;
    function calculateInitialLiquidity({ amountA, amountB, }: InitialLiquidityOptions): bigint;
    function calculateAmountOut({ reserveIn, reserveOut, amountIn, tradingFeeNumerator, }: CalculateAmountOutOptions): bigint;
    function calculateAmountOutFraction({ reserveIn, reserveOut, amountIn, tradingFeeNumerator, }: CalculateAmountOutFractionOptions): [bigint, bigint];
    function calculateAmountIn({ reserveIn, reserveOut, amountOut, tradingFeeNumerator, }: CalculateAmountInOptions): bigint;
    function calculateMaxInSwap({ reserveIn, reserveOut, tradingFeeNumerator, ioRatio, }: CalculateMaxInSwapOptions): bigint;
    function calculateDepositAmount({ amountA, amountB, poolInfo, }: CalculateDepositAmountOptions): bigint;
    function calculateDepositSwapAmount({ amountIn, amountOut, reserveIn, reserveOut, tradingFeeNumerator, }: CalculateDepositSwapAmountOptions): Fraction;
    function calculateWithdrawAmount({ withdrawalLPAmount, datumReserves, totalLiquidity, }: CalculateWithdrawAmountOptions): {
        withdrawalA: bigint;
        withdrawalB: bigint;
    };
    function calculateZapOutAmount({ withdrawalLPAmount, direction, poolInfo, }: CalculateZapOutAmountOptions): bigint;
}
declare namespace StableswapCalculation {
    export function getD(mulBalances: bigint[], amp: bigint): bigint;
    export function getY(i: number, j: number, x: bigint, xp: bigint[], amp: bigint): bigint;
    export function getYD(i: number, xp: bigint[], amp: bigint, d: bigint): bigint;
    export function getDMem(balances: bigint[], multiples: bigint[], amp: bigint): bigint;
    type CommonStableswapCalculationOptions = {
        amp: bigint;
        multiples: bigint[];
        datumBalances: bigint[];
        fee: bigint;
        adminFee: bigint;
        feeDenominator: bigint;
    };
    /**
     * @property {number} inIndex - index of asset in config assets that you want to swap
     * @property {bigint} amountIn - amount of asset that you want to swap
     * @property {number} outIndex - index of asset in config assets that you want to receive
     */
    export type StableswapCalculateSwapOptions = CommonStableswapCalculationOptions & {
        inIndex: number;
        outIndex: number;
        amountIn: bigint;
    };
    /**
     * @property {bigint[]} amountIns - amount of assets that you want to deposit ordering by assets in config
     * @property {bigint} totalLiquidity - amount of asset that you want to swap
     */
    export type StableswapCalculateDepositOptions = CommonStableswapCalculationOptions & {
        amountIns: bigint[];
        totalLiquidity: bigint;
    };
    export type StableswapCalculateWithdrawOptions = Omit<CommonStableswapCalculationOptions, "amp" | "fee" | "adminFee" | "feeDenominator"> & {
        withdrawalLPAmount: bigint;
        totalLiquidity: bigint;
    };
    /**
     * @property {bigint[]} withdrawAmounts - exactly amount of assets that you want to withdraw ordering by assets in config
     */
    export type StableswapCalculateWithdrawImbalanceOptions = CommonStableswapCalculationOptions & {
        withdrawAmounts: bigint[];
        totalLiquidity: bigint;
    };
    /**
     * @property {bigint} amountLpIn - exactly LP amount that you want to withdraw
     * @property {number} outIndex - index of asset that you want to zap out in config assets
     */
    export type StableswapCalculateZapOutOptions = CommonStableswapCalculationOptions & {
        amountLpIn: bigint;
        outIndex: number;
        totalLiquidity: bigint;
    };
    /**
     * @returns amount of asset that you want to receive.
     */
    export function calculateSwapAmount({ inIndex, outIndex, amountIn, amp, multiples, datumBalances, fee, adminFee, feeDenominator, }: StableswapCalculateSwapOptions): bigint;
    /**
     * @returns amount of liquidity asset you receive.
     */
    export function calculateDeposit({ amountIns, amp, multiples, datumBalances, totalLiquidity, fee, adminFee, feeDenominator, }: StableswapCalculateDepositOptions): bigint;
    /**
     * @returns amounts of asset you can receive ordering by config assets
     */
    export function calculateWithdraw({ withdrawalLPAmount, multiples, datumBalances, totalLiquidity, }: StableswapCalculateWithdrawOptions): bigint[];
    /**
     * @returns lp asset amount you need to provide to receive exactly amount of assets in the pool
     */
    export function calculateWithdrawImbalance({ withdrawAmounts, amp, multiples, datumBalances, totalLiquidity, fee, feeDenominator, }: StableswapCalculateWithdrawImbalanceOptions): bigint;
    /**
     * @returns amount asset amount you want receive
     */
    export function calculateZapOut({ amountLpIn, outIndex, amp, multiples, datumBalances, totalLiquidity, fee, adminFee, feeDenominator, }: StableswapCalculateZapOutOptions): bigint;
    export function getPrice(balances: bigint[], multiples: bigint[], amp: bigint, assetAIndex: number, assetBIndex: number): [bigint, bigint];
    export {  };
}
declare function compareUtxo(s1: Utxo, s2: Utxo): number;

/**
 * Request to update the trading fees for a liquidity pool.
 * @property managerAddress - The address of the pool manager authorized to update fees
 * @property poolLPAsset - The LP token asset identifying the pool
 * @property newFeeA - The new fee for trading direction A as a percentage (0.05% - 20%)
 * @property newFeeB - The new fee for trading direction B as a percentage (0.05% - 20%)
 * @property version - Protocol version for the fee request format
 */
type PoolFeeRequest = {
    managerAddress: string;
    poolLPAsset: Asset;
    newFeeA: number;
    newFeeB: number;
    version: "1";
};
type RequestPoolFeeOptions = {
    request: Omit<PoolFeeRequest, "version">;
};
declare class Dao {
    private readonly lucid;
    private readonly networkId;
    constructor(lucid: Lucid);
    /**
     * Creates a transaction to update the trading fees for a liquidity pool.
     * This method builds a transaction with metadata that requests fee changes for a pool.
     * The transaction must be signed by the pool manager address.
     */
    updatePoolFeeTx(options: Omit<PoolFeeRequest, "version">): Promise<TxComplete>;
}

type DexV1CustomReceiver = {
    receiver: string;
    receiverDatum?: {
        hash: string;
        datum: string;
    };
};
/**
 * Common options for build Minswap transaction
 * @sender The owner of this order, it will be used for cancelling this order
 * @availableUtxos Available UTxOs can be used in transaction
 */
type CommonOptions = {
    sender: string;
    availableUtxos: Utxo[];
};
/**
 * Options for building cancel Order
 * @orderTxId Transaction ID which order is created
 * @sender The owner of this order. The @sender must be matched with data in Order's Datum
 */
type DexV1BuildCancelOrderOptions = {
    orderUtxo: Utxo;
    sender: string;
};
/**
 * Options for building Deposit Order
 * @assetA @assetB Define pair which you want to deposit to
 * @amountA @amountB Define amount which you want to deposit to
 * @minimumLPReceived Minimum Received Amount you can accept after order is executed
 */
type DexV1BuildDepositTxOptions = CommonOptions & {
    assetA: Asset;
    assetB: Asset;
    amountA: bigint;
    amountB: bigint;
    minimumLPReceived: bigint;
};
/**
 * Options for building Zap In Order
 * @assetIn Asset you want to Zap
 * @assetOut The remaining asset of Pool which you want to Zap.
 *      For eg, in Pool ADA-MIN, if @assetIn is ADA then @assetOut will be MIN and vice versa
 * @minimumLPReceived Minimum Received Amount you can accept after order is executed
 */
type DexV1BuildZapInTxOptions = CommonOptions & {
    sender: string;
    assetIn: Asset;
    amountIn: bigint;
    assetOut: Asset;
    minimumLPReceived: bigint;
};
/**
 * Options for building Withdrawal Order
 * @lpAsset LP Asset will be withdrawed
 * @lpAmount LP Asset amount will be withdrawed
 * @minimumAssetAReceived Minimum Received of Asset A in the Pool you can accept after order is executed
 * @minimumAssetBReceived Minimum Received of Asset A in the Pool you can accept after order is executed
 */
type DexV1BuildWithdrawTxOptions = CommonOptions & {
    lpAsset: Asset;
    lpAmount: bigint;
    minimumAssetAReceived: bigint;
    minimumAssetBReceived: bigint;
};
/**
 * Options for building Swap Exact Out Order
 * @assetIn Asset you want to Swap
 * @assetOut Asset you want to receive
 * @maximumAmountIn The maximum Amount of Asset In which will be spent after order is executed
 * @expectedAmountOut The expected Amount of Asset Out you want to receive after order is executed
 */
type DexV1BuildSwapExactOutTxOptions = CommonOptions & {
    customReceiver?: DexV1CustomReceiver;
    assetIn: Asset;
    assetOut: Asset;
    maximumAmountIn: bigint;
    expectedAmountOut: bigint;
};
/**
 * Options for building Swap Exact In Order
 * @assetIn Asset and its amount you want to Swap
 * @amountIn Amount of Asset In you want to Swap
 * @assetOut Asset and you want to receive
 * @minimumAmountOut The minimum Amount of Asset Out you can accept after order is executed
 * @isLimitOrder Define this order is Limit Order or not
 */
type DexV1BuildSwapExactInTxOptions = CommonOptions & {
    customReceiver?: DexV1CustomReceiver;
    assetIn: Asset;
    amountIn: bigint;
    assetOut: Asset;
    minimumAmountOut: bigint;
    isLimitOrder: boolean;
};
declare class Dex {
    private readonly lucid;
    private readonly networkId;
    constructor(lucid: Lucid);
    buildSwapExactInTx(options: DexV1BuildSwapExactInTxOptions): Promise<TxComplete>;
    buildSwapExactOutTx(options: DexV1BuildSwapExactOutTxOptions): Promise<TxComplete>;
    buildWithdrawTx(options: DexV1BuildWithdrawTxOptions): Promise<TxComplete>;
    buildZapInTx(options: DexV1BuildZapInTxOptions): Promise<TxComplete>;
    buildDepositTx(options: DexV1BuildDepositTxOptions): Promise<TxComplete>;
    buildCancelOrder(options: DexV1BuildCancelOrderOptions): Promise<TxComplete>;
}

type DexV2CustomReceiver = {
    refundReceiver: string;
    refundReceiverDatum?: {
        type: OrderV2.ExtraDatumType.DATUM_HASH | OrderV2.ExtraDatumType.INLINE_DATUM;
        datum: string;
    };
    successReceiver: string;
    successReceiverDatum?: {
        type: OrderV2.ExtraDatumType.DATUM_HASH | OrderV2.ExtraDatumType.INLINE_DATUM;
        datum: string;
    };
};
/**
 * Options for building Pool V2 Creation transaction
 * @assetA
 * @assetB
 * @amountA
 * @amountB
 * @tradingFeeNumerator numerator of Pool's trading fee with denominator 10000
 *    Eg:
 *      - fee 0.05% -> tradingFeeNumerator 5
 *      - fee 0.3% -> tradingFeeNumerator 30
 *      - fee 1% -> tradingFeeNumerator 100
 */
type DexV2CreatePoolOptions = {
    assetA: Asset;
    assetB: Asset;
    amountA: bigint;
    amountB: bigint;
    tradingFeeNumerator: bigint;
};
type DexV2BulkOrdersOption = {
    sender: string;
    orderOptions: DexV2OrderOptions[];
    expiredOptions?: OrderV2.ExpirySetting;
    composeTx?: Tx;
    authorizationMethodType?: OrderV2.AuthorizationMethodType;
};
type DexV2SwapRouting = {
    lpAsset: Asset;
    direction: OrderV2.Direction;
};
type DexV2DepositOptions = {
    type: OrderV2.StepType.DEPOSIT;
    assetA: Asset;
    assetB: Asset;
    amountA: bigint;
    amountB: bigint;
    minimumLPReceived: bigint;
    killOnFailed: boolean;
};
type DexV2WithdrawOptions = {
    type: OrderV2.StepType.WITHDRAW;
    lpAmount: bigint;
    minimumAssetAReceived: bigint;
    minimumAssetBReceived: bigint;
    killOnFailed: boolean;
};
type DexV2SwapExactInOptions = {
    type: OrderV2.StepType.SWAP_EXACT_IN;
    assetIn: Asset;
    amountIn: bigint;
    minimumAmountOut: bigint;
    direction: OrderV2.Direction;
    killOnFailed: boolean;
    isLimitOrder: boolean;
};
type DexV2SwapExactOutOptions = {
    type: OrderV2.StepType.SWAP_EXACT_OUT;
    assetIn: Asset;
    maximumAmountIn: bigint;
    expectedReceived: bigint;
    direction: OrderV2.Direction;
    killOnFailed: boolean;
};
type DexV2StopOptions = {
    type: OrderV2.StepType.STOP;
    assetIn: Asset;
    amountIn: bigint;
    stopAmount: bigint;
    direction: OrderV2.Direction;
};
type DexV2OCOOptions = {
    type: OrderV2.StepType.OCO;
    assetIn: Asset;
    amountIn: bigint;
    limitAmount: bigint;
    stopAmount: bigint;
    direction: OrderV2.Direction;
};
type DexV2ZapOutOptions = {
    type: OrderV2.StepType.ZAP_OUT;
    lpAmount: bigint;
    direction: OrderV2.Direction;
    minimumReceived: bigint;
    killOnFailed: boolean;
};
type DexV2PartialSwapOptions = {
    type: OrderV2.StepType.PARTIAL_SWAP;
    assetIn: Asset;
    amountIn: bigint;
    direction: OrderV2.Direction;
    expectedInOutRatio: [bigint, bigint];
    maximumSwapTime: number;
    minimumSwapAmountRequired: bigint;
};
type DexV2WithdrawImbalanceOptions = {
    type: OrderV2.StepType.WITHDRAW_IMBALANCE;
    lpAmount: bigint;
    ratioAssetA: bigint;
    ratioAssetB: bigint;
    minimumAssetA: bigint;
    killOnFailed: boolean;
};
type DexV2MultiRoutingOptions = {
    type: OrderV2.StepType.SWAP_ROUTING;
    assetIn: Asset;
    amountIn: bigint;
    routings: OrderV2.Route[];
    minimumReceived: bigint;
};
type DexV2OrderOptions = (DexV2DepositOptions | DexV2WithdrawOptions | DexV2SwapExactInOptions | DexV2SwapExactOutOptions | DexV2StopOptions | DexV2OCOOptions | DexV2ZapOutOptions | DexV2PartialSwapOptions | DexV2WithdrawImbalanceOptions | DexV2MultiRoutingOptions) & {
    lpAsset: Asset;
    customReceiver?: DexV2CustomReceiver;
};
type DexV2CancelBulkOrdersOptions = {
    orderOutRefs: OutRef[];
    composeTx?: Tx;
    AuthorizationMethodType?: OrderV2.AuthorizationMethodType;
};
type DexV2CancelExpiredOrderOptions = {
    orderUtxos: Utxo[];
    availableUtxos: Utxo[];
    currentSlot: number;
    extraDatumMap: Record<string, string>;
};
declare class DexV2 {
    private readonly lucid;
    private readonly networkId;
    private readonly adapter;
    constructor(lucid: Lucid, adapter: Adapter);
    createPoolTx({ assetA, assetB, amountA, amountB, tradingFeeNumerator, }: DexV2CreatePoolOptions): Promise<TxComplete>;
    private buildOrderValue;
    buildOrderStep(options: DexV2OrderOptions, finalBatcherFee: bigint): OrderV2.Step;
    private buildOrderAddress;
    private getOrderMetadata;
    createBulkOrdersTx({ sender, orderOptions, expiredOptions, composeTx, authorizationMethodType, }: DexV2BulkOrdersOption): Promise<TxComplete>;
    cancelOrder({ orderOutRefs, composeTx, }: DexV2CancelBulkOrdersOptions): Promise<TxComplete>;
    cancelExpiredOrders({ orderUtxos, currentSlot, availableUtxos, extraDatumMap, }: DexV2CancelExpiredOrderOptions): Promise<TxComplete>;
}

type DexV2WorkerConstructor = {
    lucid: Lucid;
    blockfrostAdapter: BlockfrostAdapter;
    privateKey: string;
};
declare class ExpiredOrderMonitor {
    private readonly lucid;
    private readonly blockfrostAdapter;
    private readonly privateKey;
    constructor({ lucid, blockfrostAdapter, privateKey, }: DexV2WorkerConstructor);
    start(): Promise<void>;
    runWorker(): Promise<void>;
}

type LbeV2SocialLinks = {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
};
type LbeV2Tokenomic = {
    tag: string;
    percentage: string;
};
type LbeV2ProjectDetails = {
    eventName: string;
    description?: string;
    socialLinks?: LbeV2SocialLinks;
    tokenomics?: LbeV2Tokenomic[];
};
type LbeV2CreateEventOptions = {
    factoryUtxo: Utxo;
    lbeV2Parameters: LbeV2Types.LbeV2Parameters;
    currentSlot: number;
    sellerOwner: string;
    sellerCount?: number;
    projectDetails?: LbeV2ProjectDetails;
};
type LbeV2UpdateEventOptions = {
    owner: string;
    treasuryUtxo: Utxo;
    lbeV2Parameters: LbeV2Types.LbeV2Parameters;
    currentSlot: number;
    projectDetails?: LbeV2ProjectDetails;
};
type LbeV2CancelEventOptions = {
    treasuryUtxo: Utxo;
    cancelData: {
        reason: LbeV2Types.CancelReason.BY_OWNER;
        owner: string;
    } | {
        reason: LbeV2Types.CancelReason.NOT_REACH_MINIMUM;
    } | {
        reason: LbeV2Types.CancelReason.CREATED_POOL;
        ammPoolUtxo: Utxo;
    };
    currentSlot: number;
};
type LbeV2ManageOrderAction = {
    type: "deposit";
    additionalAmount: bigint;
} | {
    type: "withdraw";
    withdrawalAmount: bigint;
};
type LbeV2DepositOrWithdrawOptions = {
    currentSlot: number;
    existingOrderUtxos: Utxo[];
    treasuryUtxo: Utxo;
    sellerUtxo: Utxo;
    owner: string;
    action: LbeV2ManageOrderAction;
};
type LbeV2CloseEventOptions = {
    treasuryUtxo: Utxo;
    headFactoryUtxo: Utxo;
    tailFactoryUtxo: Utxo;
    currentSlot: number;
    owner: string;
};
type LbeV2AddSellersOptions = {
    treasuryUtxo: Utxo;
    managerUtxo: Utxo;
    addSellerCount: number;
    sellerOwner: string;
    currentSlot: number;
};
type LbeV2CountingSellersOptions = {
    treasuryUtxo: Utxo;
    managerUtxo: Utxo;
    sellerUtxos: Utxo[];
    currentSlot: number;
};
type LbeV2CollectManagerOptions = {
    treasuryUtxo: Utxo;
    managerUtxo: Utxo;
    currentSlot: number;
};
type LbeV2CollectOrdersOptions = {
    treasuryUtxo: Utxo;
    orderUtxos: Utxo[];
    currentSlot: number;
};
type LbeV2RedeemOrdersOptions = {
    treasuryUtxo: Utxo;
    orderUtxos: Utxo[];
    currentSlot: number;
};
type LbeV2RefundOrdersOptions = {
    treasuryUtxo: Utxo;
    orderUtxos: Utxo[];
    currentSlot: number;
};
type LbeV2CreateAmmPoolTxOptions = {
    treasuryUtxo: Utxo;
    ammFactoryUtxo: Utxo;
    currentSlot: number;
};
type LbeV2CalculationRedeemAmountParams = {
    userAmount: bigint;
    totalPenalty: bigint;
    reserveRaise: bigint;
    totalLiquidity: bigint;
    maxRaise?: bigint;
};

declare class LbeV2 {
    private readonly lucid;
    private readonly networkId;
    constructor(lucid: Lucid);
    createEvent(options: LbeV2CreateEventOptions): Promise<TxComplete>;
    updateEvent(options: LbeV2UpdateEventOptions): Promise<TxComplete>;
    cancelEvent(options: LbeV2CancelEventOptions): Promise<TxComplete>;
    calculatePenaltyAmount(options: {
        time: bigint;
        totalInputAmount: bigint;
        totalOutputAmount: bigint;
        penaltyConfig?: LbeV2Types.PenaltyConfig;
    }): bigint;
    depositOrWithdrawOrder(options: LbeV2DepositOrWithdrawOptions): Promise<TxComplete>;
    closeEventTx(options: LbeV2CloseEventOptions): Promise<TxComplete>;
    addSellers(options: LbeV2AddSellersOptions): Promise<TxComplete>;
    countingSellers(options: LbeV2CountingSellersOptions): Promise<TxComplete>;
    collectManager(options: LbeV2CollectManagerOptions): Promise<TxComplete>;
    collectOrders(options: LbeV2CollectOrdersOptions): Promise<TxComplete>;
    calculateRedeemAmount(params: LbeV2CalculationRedeemAmountParams): {
        liquidityAmount: bigint;
        returnedRaiseAmount: bigint;
    };
    redeemOrders(options: LbeV2RedeemOrdersOptions): Promise<TxComplete>;
    refundOrders(options: LbeV2RefundOrdersOptions): Promise<TxComplete>;
    createAmmPool(options: LbeV2CreateAmmPoolTxOptions): Promise<TxComplete>;
    private buildCreateAMMPool;
}

type LbeV2WorkerConstructor = {
    networkEnv: NetworkEnvironment;
    networkId: NetworkId;
    lucid: Lucid;
    blockfrostAdapter: BlockfrostAdapter;
    privateKey: string;
};
type LbeV2EventData = {
    treasuryUtxo: Utxo;
    managerUtxo?: Utxo;
    sellerUtxos: Utxo[];
    collectedOrderUtxos: Utxo[];
    uncollectedOrderUtxos: Utxo[];
};
declare class LbeV2Worker {
    private readonly networkEnv;
    private readonly networkId;
    private readonly lucid;
    private readonly blockfrostAdapter;
    private readonly privateKey;
    constructor({ networkEnv, networkId, lucid, blockfrostAdapter, privateKey, }: LbeV2WorkerConstructor);
    start(): Promise<void>;
    getData(): Promise<LbeV2EventData[]>;
    countingSellers(eventData: LbeV2EventData, currentTime: number): Promise<void>;
    collectManager(eventData: LbeV2EventData, currentTime: number): Promise<void>;
    collectOrders(eventData: LbeV2EventData, currentTime: number): Promise<void>;
    createAmmPoolOrCancelEvent(eventData: LbeV2EventData, currentTime: number): Promise<void>;
    redeemOrders(eventData: LbeV2EventData, currentTime: number): Promise<void>;
    refundOrders(eventData: LbeV2EventData, currentTime: number): Promise<void>;
    handleEvent(eventData: LbeV2EventData, currentTime: number): Promise<"skip" | "success">;
    runWorker(): Promise<void>;
}

type StableswapCustomReceiver = {
    receiver: string;
    receiverDatum?: {
        hash: string;
        datum: string;
    };
};
/**
 * @property {bigint} assetInIndex - Index of asset you want to swap in config assets
 * @property {bigint} assetOutIndex - Index of asset you want to receive in config assets
 */
type StableswapSwapOptions = {
    type: StableOrder.StepType.SWAP;
    assetInAmount: bigint;
    assetInIndex: bigint;
    assetOutIndex: bigint;
    minimumAssetOut: bigint;
};
type StableswapDepositOptions = {
    type: StableOrder.StepType.DEPOSIT;
    assetsAmount: [Asset, bigint][];
    minimumLPReceived: bigint;
    totalLiquidity: bigint;
};
type StableswapWithdrawOptions = {
    type: StableOrder.StepType.WITHDRAW;
    lpAmount: bigint;
    minimumAmounts: bigint[];
};
type StableswapWithdrawImbalanceOptions = {
    type: StableOrder.StepType.WITHDRAW_IMBALANCE;
    lpAmount: bigint;
    withdrawAmounts: bigint[];
};
/**
 * @property {bigint} assetOutIndex - Index of asset you want to receive in config assets
 */
type StableswapZapOutOptions = {
    type: StableOrder.StepType.ZAP_OUT;
    lpAmount: bigint;
    assetOutIndex: bigint;
    minimumAssetOut: bigint;
};
type StableswapOrderOptions = (StableswapDepositOptions | StableswapWithdrawOptions | StableswapSwapOptions | StableswapWithdrawImbalanceOptions | StableswapZapOutOptions) & {
    lpAsset: Asset;
    customReceiver?: StableswapCustomReceiver;
};
type StableswapBulkOrdersOption = {
    options: StableswapOrderOptions[];
    sender: string;
    availableUtxos: Utxo[];
};
type StableswapBuildCancelOrderOptions = {
    orderUtxos: Utxo[];
};
declare class Stableswap {
    private readonly lucid;
    private readonly networkId;
    constructor(lucid: Lucid);
    buildOrderValue(option: StableswapOrderOptions): Assets;
    buildOrderStep(option: StableswapOrderOptions): StableOrder.Step;
    private getOrderMetadata;
    createBulkOrdersTx(options: StableswapBulkOrdersOption): Promise<TxComplete>;
    buildCancelOrdersTx(options: StableswapBuildCancelOrderOptions): Promise<TxComplete>;
}

/**
 * Initialize Lucid Instance for Backend Environment
 * @param network Network you're working on
 * @param projectId Blockfrost API KEY
 * @param blockfrostUrl Blockfrost URL
 * @param address Your own address
 * @returns
 */
declare function getBackendBlockfrostLucidInstance(networkId: NetworkId, projectId: string, blockfrostUrl: string, address: string): Promise<Lucid>;
/**
 * Initialize Lucid Maestro Instance for Backend Environment
 * @param network Network you're working on
 * @param apiKey Maestro API KEY
 * @param address Your own address
 * @returns
 */
declare function getBackendMaestroLucidInstance(network: MaestroSupportedNetworks, apiKey: string, address: string): Promise<Lucid>;

type DataType = Data;
declare const DataObject: any;

export { ADA, type Adapter, Asset, BlockfrostAdapter, type CalculateDepositOptions, type CalculateSwapExactInOptions, type CalculateSwapExactOutOptions, type CalculateSwapExactOutWithSlippageToleranceOptions, type CalculateWithdrawOptions, type CalculateZapInOptions, DEFAULT_POOL_V2_TRADING_FEE_DENOMINATOR, Dao, DataObject, type DataType, Dex, type DexV1BuildCancelOrderOptions, type DexV1BuildDepositTxOptions, type DexV1BuildSwapExactInTxOptions, type DexV1BuildSwapExactOutTxOptions, type DexV1BuildWithdrawTxOptions, type DexV1BuildZapInTxOptions, DexV1Constant, type DexV1CustomReceiver, DexV2, type DexV2BulkOrdersOption, DexV2Calculation, type DexV2CancelBulkOrdersOptions, type DexV2CancelExpiredOrderOptions, DexV2Constant, type DexV2CreatePoolOptions, type DexV2CustomReceiver, type DexV2DepositOptions, type DexV2MultiRoutingOptions, type DexV2OCOOptions, type DexV2OrderOptions, type DexV2PartialSwapOptions, type DexV2StopOptions, type DexV2SwapExactInOptions, type DexV2SwapExactOutOptions, type DexV2SwapRouting, type DexV2WithdrawImbalanceOptions, type DexV2WithdrawOptions, type DexV2ZapOutOptions, ExpiredOrderMonitor, FIXED_DEPOSIT_ADA, FactoryV2, type GetPoolByIdParams, type GetPoolInTxParams, type GetPoolPriceParams, type GetStablePoolHistoryParams, type GetStablePoolPriceParams, type GetV1PoolHistoryParams, type GetV2PoolHistoryParams, type GetV2PoolPriceParams, LbeV2, type LbeV2AddSellersOptions, type LbeV2CalculationRedeemAmountParams, type LbeV2CancelEventOptions, type LbeV2CloseEventOptions, type LbeV2CollectManagerOptions, type LbeV2CollectOrdersOptions, LbeV2Constant, type LbeV2CountingSellersOptions, type LbeV2CreateAmmPoolTxOptions, type LbeV2CreateEventOptions, type LbeV2DepositOrWithdrawOptions, type LbeV2EventData, type LbeV2ManageOrderAction, type LbeV2ProjectDetails, type LbeV2RedeemOrdersOptions, type LbeV2RefundOrdersOptions, type LbeV2SocialLinks, type LbeV2Tokenomic, LbeV2Types, type LbeV2UpdateEventOptions, LbeV2Worker, MAX_POOL_V2_TRADING_FEE_NUMERATOR, MIN_POOL_V2_TRADING_FEE_NUMERATOR, MaestroAdapter, MaestroServerError, MetadataMessage, MinswapAdapter, type MinswapAdapterConstructor, NetworkEnvironment, NetworkId, OrderV1, OrderV2, type Pagination, type PaginationByCursor, type PaginationByPage, type PoolFeeRequest, PoolV1, PoolV2, type RequestPoolFeeOptions, SECURITY_PARAM, type SlotConfig, StableOrder, StablePool, Stableswap, type StableswapBuildCancelOrderOptions, type StableswapBulkOrdersOption, StableswapCalculation, StableswapConstant, type StableswapCustomReceiver, type StableswapDepositOptions, type StableswapOrderOptions, type StableswapSwapOptions, type StableswapWithdrawImbalanceOptions, type StableswapWithdrawOptions, type StableswapZapOutOptions, calculateAmountWithSlippageTolerance, calculateDeposit, calculateSwapExactIn, calculateSwapExactOut, calculateWithdraw, calculateZapIn, compareUtxo, getBackendBlockfrostLucidInstance, getBackendMaestroLucidInstance };
