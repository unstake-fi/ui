import { browser } from "$app/environment";
import { savedNetwork } from "$lib/network/stores";
import { refreshing } from "$lib/refreshing";
import { adapterToIWallet } from "$lib/wallet/adapters";
import { persisted } from "svelte-persisted-store";
import { get, writable } from "svelte/store";
import { WalletAdapter, type ISigner } from "./adapters/types";

export const savedAdapter = browser ? persisted('wallet-adapter', WalletAdapter.Disconnected) : writable(WalletAdapter.Disconnected);

export const signer = refreshing<ISigner | null>(async (old) => {
    if (old) old.disconnect();
    const adapter = get(savedAdapter);
    const network = get(savedNetwork);
    let handle = await adapterToIWallet(adapter);
    let wallet = await handle?.connect(network.chainId).catch((error) => {
        console.error(error);
        savedAdapter.set(WalletAdapter.Disconnected);
        return null;
    });
    return wallet ?? null;
}, { refreshOn: [savedAdapter, savedNetwork], eager: true });
export const signerResolved = signer.resolved;