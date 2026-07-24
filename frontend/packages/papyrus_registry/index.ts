/**
 * PLACEHOLDER CLIENT.
 *
 * `stellar-scaffold build` auto-generates a fully-typed TypeScript client
 * for the papyrus_registry contract straight from its WASM/Rust bindings —
 * that generated file will overwrite this one. This hand-written version
 * exists so `pnpm dev` / `next build` succeed in this sandbox, where no
 * Rust toolchain is available to actually build the contract.
 *
 * Once you run `stellar-scaffold build` locally, delete this file and let
 * the generated client take its place (same import path).
 */
import {
  Contract,
  rpc as StellarRpc,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const NETWORK_CONFIG = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
  },
  mainnet: {
    rpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: Networks.PUBLIC,
  },
} as const;

interface ClientOptions {
  network: keyof typeof NETWORK_CONFIG;
  contractId: string;
}

export class PapyrusRegistryClient {
  private server: StellarRpc.Server;
  private contract: Contract;
  private networkPassphrase: string;

  constructor(opts: ClientOptions) {
    const cfg = NETWORK_CONFIG[opts.network];
    this.server = new StellarRpc.Server(cfg.rpcUrl);
    this.contract = new Contract(opts.contractId);
    this.networkPassphrase = cfg.networkPassphrase;
  }

  async register_document(params: {
    owner: string;
    doc_hash: string;
    metadata_uri: string;
  }) {
    return this.invoke("register_document", [
      nativeToScVal(params.owner, { type: "address" }),
      nativeToScVal(params.doc_hash, { type: "string" }),
      nativeToScVal(params.metadata_uri, { type: "string" }),
    ]);
  }

  async is_registered(doc_hash: string): Promise<boolean> {
    const result = await this.simulate("is_registered", [
      nativeToScVal(doc_hash, { type: "string" }),
    ]);
    return scValToNative(result) as boolean;
  }

  private async simulate(method: string, args: ReturnType<typeof nativeToScVal>[]) {
    const account = await this.server.getAccount(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();
    const sim = await this.server.simulateTransaction(tx);
    if (StellarRpc.Api.isSimulationError(sim)) {
      throw new Error(sim.error);
    }
    return sim.result!.retval;
  }

  private async invoke(method: string, args: ReturnType<typeof nativeToScVal>[]) {
    const publicKey = args[0]; // owner is always first arg in our contract
    const sourceAddress = scValToNative(publicKey) as string;

    const account = await this.server.getAccount(sourceAddress);
    let tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(60)
      .build();

    const prepared = await this.server.prepareTransaction(tx);

    const signed = await signTransaction(prepared.toXDR(), {
      networkPassphrase: this.networkPassphrase,
    });
    if (signed.error) {
      throw new Error(signed.error);
    }

    const signedTx = TransactionBuilder.fromXDR(
      signed.signedTxXdr,
      this.networkPassphrase
    );
    const sendResult = await this.server.sendTransaction(signedTx);

    if (sendResult.status === "ERROR") {
      throw new Error(`Transaction submission failed: ${sendResult.errorResult}`);
    }

    return this.pollForResult(sendResult.hash);
  }

  private async pollForResult(hash: string) {
    for (let i = 0; i < 15; i++) {
      const res = await this.server.getTransaction(hash);
      if (res.status === "SUCCESS") return res;
      if (res.status === "FAILED") {
        throw new Error("Transaction failed on-chain");
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error("Timed out waiting for transaction confirmation");
  }
}
