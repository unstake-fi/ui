import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import type { StdFee } from "@cosmjs/stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";
import IconXDefi from "../icons/IconXDefi.svelte";
import { convertAccountData, offlineSignerSign } from "./common";
import { ConnectionError, WalletAdapter, type AccountData, type ISigner, type WalletMetadata } from "./types";
import { browser } from "$app/environment";

declare global {
    interface Window extends KeplrWindow {
        xfi: {
            keplr: Keplr;
        }
    }
}

export class XDefi implements ISigner {
    private constructor(private acc: AccountData, private signer: OfflineSigner) { }

    public static async connect(chain: string): Promise<XDefi> {
        if (!XDefi.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const xfi = window.xfi.keplr!;

        try {
            await xfi.experimentalSuggestChain(CHAIN_INFO[chain as NETWORK]);
            await xfi.enable(chain);
            const offlineSigner = await xfi.getOfflineSignerAuto(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            return new XDefi(convertAccountData(accounts[0]), offlineSigner as OfflineSigner);
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.XDefi,
        name: 'XDefi',
        logo: IconXDefi,
        canSign: true,
    };
    public getMetadata(): WalletMetadata { return XDefi.metadata; }

    public static async isInstalled(): Promise<boolean> { return browser &&!!window.xfi; }

    public account(): AccountData { return this.acc; }

    public async sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        fee: StdFee,
        memo?: string
    ): Promise<Uint8Array> {
        return offlineSignerSign(this.signer, this.acc.address, client, msgs, fee, memo);
    }
}