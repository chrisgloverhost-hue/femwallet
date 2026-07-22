/**
 * Public / community RPC endpoints used as fallback when no custom RPC is
 * configured and OneKey's own backend is unreachable.
 *
 * Keyed by network id (same format as IServerNetwork.id / networkId).
 *
 * Sources: Chainlist.org, official chain docs, and well-known public nodes.
 * Prefer HTTPS; WSS noted where only websocket is available.
 */
export const PUBLIC_RPC_URLS: Record<string, string> = {
  // ─── EVM ─────────────────────────────────────────────────────────────────
  'evm--1': 'https://cloudflare-eth.com', // Ethereum
  'evm--56': 'https://bsc-dataseed1.binance.org', // BNB Chain
  'evm--137': 'https://polygon-rpc.com', // Polygon
  'evm--42161': 'https://arb1.arbitrum.io/rpc', // Arbitrum One
  'evm--43114': 'https://api.avax.network/ext/bc/C/rpc', // Avalanche C-Chain
  'evm--10': 'https://mainnet.optimism.io', // Optimism
  'evm--324': 'https://mainnet.era.zksync.io', // zkSync Era
  'evm--204': 'https://opbnb-mainnet-rpc.bnbchain.org', // opBNB
  'evm--8453': 'https://mainnet.base.org', // Base
  'evm--250': 'https://rpc.ftm.tools', // Fantom
  'evm--100': 'https://rpc.gnosischain.com', // Gnosis
  'evm--1284': 'https://rpc.api.moonbeam.network', // Moonbeam
  'evm--1285': 'https://rpc.api.moonriver.moonbeam.network', // Moonriver
  'evm--25': 'https://evm.cronos.org', // Cronos
  'evm--1666600000': 'https://api.harmony.one', // Harmony Shard 0
  'evm--1313161554': 'https://mainnet.aurora.dev', // Aurora
  'evm--2222': 'https://evm.kava.io', // Kava EVM
  'evm--1101': 'https://zkevm-rpc.com', // Polygon zkEVM
  'evm--5000': 'https://rpc.mantle.xyz', // Mantle
  'evm--169': 'https://pacific-rpc.manta.network/http', // Manta Pacific
  'evm--534352': 'https://rpc.scroll.io', // Scroll
  'evm--59144': 'https://rpc.linea.build', // Linea
  'evm--7777777': 'https://rpc.zora.energy', // Zora
  'evm--42220': 'https://forno.celo.org', // Celo
  'evm--1088': 'https://andromeda.metis.io/?owner=1088', // Metis
  'evm--1030': 'https://evm.confluxscan.io', // Conflux eSpace
  'evm--8217': 'https://public-en-cypress.klaytn.net', // Klaytn
  'evm--361': 'https://eth-rpc-api.thetatoken.org/rpc', // Theta
  'evm--2000': 'https://rpc.dogechain.dog', // Dogechain
  'evm--1116': 'https://rpc.coredao.org', // Core DAO
  'evm--369': 'https://rpc.pulsechain.com', // PulseChain
  'evm--40': 'https://mainnet.telos.net/evm', // Telos EVM
  'evm--2020': 'https://api.roninchain.com/rpc', // Ronin
  'evm--4337': 'https://mainnet.beam.bz', // Beam
  'evm--81457': 'https://rpc.blast.io', // Blast
  'evm--60808': 'https://bob-mainnet.public.blastapi.io', // BOB
  'evm--196': 'https://exchainrpc.okex.org', // OKC (OKX Chain)
  'evm--66': 'https://exchainrpc.okex.org', // OKX Chain legacy id
  'evm--128': 'https://http-mainnet.hecochain.com', // HECO
  'evm--1666700000': 'https://api.s0.b.hmny.io', // Harmony testnet shard 0
  'evm--43113': 'https://api.avax-test.network/ext/bc/C/rpc', // Avalanche Fuji (testnet)
  'evm--11155111': 'https://rpc.sepolia.org', // Ethereum Sepolia (testnet)
  'evm--80001': 'https://rpc-mumbai.maticvigil.com', // Polygon Mumbai (testnet)
  'evm--97': 'https://data-seed-prebsc-1-s1.binance.org:8545', // BSC Testnet
  'evm--421614': 'https://sepolia-rollup.arbitrum.io/rpc', // Arbitrum Sepolia (testnet)
  'evm--11155420': 'https://sepolia.optimism.io', // Optimism Sepolia (testnet)

  // ─── Solana ──────────────────────────────────────────────────────────────
  'sol--101': 'https://api.mainnet-beta.solana.com',
  sol: 'https://api.mainnet-beta.solana.com',

  // ─── Bitcoin (REST via Blockstream Esplora) ───────────────────────────────
  'btc--0': 'https://blockstream.info/api',
  btc: 'https://blockstream.info/api',

  // ─── Tron ────────────────────────────────────────────────────────────────
  'tron--0x2b6653dc': 'https://api.trongrid.io',
  tron: 'https://api.trongrid.io',

  // ─── TON ─────────────────────────────────────────────────────────────────
  'ton--mainnet': 'https://toncenter.com/api/v2/jsonRPC',
  ton: 'https://toncenter.com/api/v2/jsonRPC',

  // ─── Cosmos / IBC ────────────────────────────────────────────────────────
  'cosmos--cosmoshub-4': 'https://cosmos-rpc.publicnode.com:443',
  cosmos: 'https://cosmos-rpc.publicnode.com:443',
  'cosmos--osmosis-1': 'https://osmosis-rpc.publicnode.com:443',
  'cosmos--juno-1': 'https://juno-rpc.publicnode.com:443',
  'cosmos--akashnet-2': 'https://akash-rpc.publicnode.com:443',

  // ─── Near ────────────────────────────────────────────────────────────────
  'near--mainnet': 'https://rpc.mainnet.near.org',
  near: 'https://rpc.mainnet.near.org',

  // ─── Polkadot / Substrate ────────────────────────────────────────────────
  'dot--polkadot': 'wss://rpc.polkadot.io',
  dot: 'wss://rpc.polkadot.io',
  'ksm--kusama': 'wss://kusama-rpc.polkadot.io',
  ksm: 'wss://kusama-rpc.polkadot.io',

  // ─── Algorand ────────────────────────────────────────────────────────────
  'algo--mainnet': 'https://mainnet-api.algonode.cloud',
  algo: 'https://mainnet-api.algonode.cloud',

  // ─── Stellar ─────────────────────────────────────────────────────────────
  'xlm--mainnet': 'https://horizon.stellar.org',
  xlm: 'https://horizon.stellar.org',

  // ─── Cardano ─────────────────────────────────────────────────────────────
  'ada--mainnet': 'https://cardano-mainnet.blockfrost.io/api/v0',
  ada: 'https://cardano-mainnet.blockfrost.io/api/v0',

  // ─── Sui ─────────────────────────────────────────────────────────────────
  'sui--mainnet': 'https://fullnode.mainnet.sui.io',
  sui: 'https://fullnode.mainnet.sui.io',

  // ─── Aptos ───────────────────────────────────────────────────────────────
  'apt--mainnet': 'https://fullnode.mainnet.aptoslabs.com/v1',
  apt: 'https://fullnode.mainnet.aptoslabs.com/v1',

  // ─── Alephium ────────────────────────────────────────────────────────────
  'alph--mainnet': 'https://backend-v113.mainnet.alephium.org',
  alph: 'https://backend-v113.mainnet.alephium.org',

  // ─── Conflux ─────────────────────────────────────────────────────────────
  'cfx--1029': 'https://main.confluxrpc.com',
  cfx: 'https://main.confluxrpc.com',

  // ─── Neo N3 ──────────────────────────────────────────────────────────────
  'neo3--mainnet': 'https://mainnet1.neo.coz.io:443',
  neo3: 'https://mainnet1.neo.coz.io:443',

  // ─── Kaspa ───────────────────────────────────────────────────────────────
  'kas--mainnet': 'https://api.kaspa.org',
  kas: 'https://api.kaspa.org',

  // ─── Filecoin ────────────────────────────────────────────────────────────
  'fil--mainnet': 'https://api.node.glif.io/rpc/v1',
  fil: 'https://api.node.glif.io/rpc/v1',

  // ─── Hedera ──────────────────────────────────────────────────────────────
  'hbar--mainnet': 'https://mainnet.hashio.io/api',
  hbar: 'https://mainnet.hashio.io/api',

  // ─── Ripple ──────────────────────────────────────────────────────────────
  'xrp--mainnet': 'wss://xrplcluster.com',
  xrp: 'wss://xrplcluster.com',

  // ─── Litecoin ────────────────────────────────────────────────────────────
  'ltc--mainnet': 'https://litecoin.info/api',
  ltc: 'https://litecoin.info/api',

  // ─── Dogecoin ────────────────────────────────────────────────────────────
  'doge--mainnet': 'https://dogechain.info/api/v1',
  doge: 'https://dogechain.info/api/v1',

  // ─── BFC ─────────────────────────────────────────────────────────────────
  'bfc--mainnet': 'https://rpc.mainnet.bifrostnetwork.com',
  bfc: 'https://rpc.mainnet.bifrostnetwork.com',

  // ─── Hyperliquid ─────────────────────────────────────────────────────────
  'hyperliquid--mainnet': 'https://api.hyperliquid.xyz/evm',
  hyperliquid: 'https://api.hyperliquid.xyz/evm',
};

/**
 * Return the public fallback RPC URL for a network, or undefined if unknown.
 */
export function getPublicRpcUrl(networkId: string): string | undefined {
  return PUBLIC_RPC_URLS[networkId];
}
