import { get } from "svelte/store";
import { refreshing } from "../refreshing";
import { signer } from "../wallet/stores";
import { client } from "../network/stores";
import { Balance, Balances } from "../wallet/coin";
import { PageRequest } from "cosmjs-types/cosmos/base/query/v1beta1/pagination";

export const balances = refreshing(
    async () => {
        const s = await get(signer);
        const c = await get(client);
        if (!s) return Balances.from([]);
        const coins = await c.bank.allBalances(
            s.account().address,
            PageRequest.fromPartial({ limit: BigInt(200) })
        );
        const balances = coins
            .map((coin) => Balance.from(coin))
            .sort((a, b) => b.normalized().minus(a.normalized()).toNumber());
        return Balances.from(balances);
    },
    { refreshOn: [signer, client] }
);