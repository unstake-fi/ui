import { browser } from "$app/environment";
import { createKujiraClient, createTMClient, selectBestRPC } from "$lib/network/connect";
import { refreshing } from "$lib/refreshing";
import type { NETWORK } from "$lib/resources/networks";
import { persisted } from "svelte-persisted-store";
import { get, writable } from "svelte/store";
import type { KujiraClient, NetworkOptions } from "./types";

export const savedNetwork = browser ? persisted<{ chainId: NETWORK }>('network', { chainId: 'kaiyo-1' }) : writable<{ chainId: NETWORK }>({ chainId: 'kaiyo-1' });
export const savedNetworkOptions = browser ? persisted<NetworkOptions>('network-options', {}) : writable<NetworkOptions>({});

export const client = refreshing<KujiraClient>(async () => {
    const { chainId } = get(savedNetwork);

    const select: () => Promise<KujiraClient | undefined> = async () => {
        const { preferredRpc } = get(savedNetworkOptions)[chainId] ?? {};
        if (!preferredRpc) {
            try {
                return await selectBestRPC(chainId);
            } catch (e) {
                // TODO: Show an error to the user
                throw e;
            }
        } else {
            try {
                return await createKujiraClient((await createTMClient(preferredRpc))[0], chainId, preferredRpc);
            } catch (e) {
                // TODO: Show a warning to the user
                savedNetworkOptions.set({
                    ...get(savedNetworkOptions),
                    [chainId]: {
                        preferredRpc: null,
                    },
                });
                return await select();
            }
        }
    };
    const c = await select();
    if (c) return c;
    // infinite promise
    await new Promise(() => { });
    // for typechecking, unreachable
    return undefined as any;
}, { refreshOn: [savedNetwork, savedNetworkOptions], debounce: 100 });