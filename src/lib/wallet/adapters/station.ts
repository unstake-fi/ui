import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import type { StdFee } from "@cosmjs/stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type StationType from "@terra-money/station-connector";
import type { ChainInfoResponse } from "@terra-money/station-connector/keplrConnector";
import IconStation from "../icons/IconStation.svelte";
import { convertAccountData, offlineSignerSign } from "./common";
import { ConnectionError, WalletAdapter, type AccountData, type ISigner, type WalletMetadata } from "./types";
import { browser } from "$app/environment";

declare global {
    interface Window {
        station?: StationType;
    }
}

export class Station implements ISigner {
    private constructor(private acc: AccountData, private signer: OfflineSigner) { }

    public static async connect(chain: string): Promise<Station> {
        if (!await Station.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const station = window.station!.keplr;

        try {
            await station.experimentalSuggestChain(CHAIN_INFO[chain as NETWORK] as ChainInfoResponse);
            await station.enable(chain);
            const offlineSigner = await station.getOfflineSignerAuto(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            return new Station(convertAccountData(accounts[0]), offlineSigner);
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Station,
        name: 'Station',
        logo: IconStation,
        canSign: true,
    };
    public getMetadata(): WalletMetadata { return Station.metadata; }

    public static async isInstalled(): Promise<boolean> { return browser && !!window.station; }

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