import { RESERVES } from "./registry";
import { savedNetwork } from "$lib/network/stores";
import { get } from "svelte/store";

export const DENOMS: { [denom: string]: { name: string, dec: number } } = {
    "factory/kujira1hf3898lecj8lawxq8nwqczegrla9denzfkx4asjg0q27cyes44sq68gvc9/ampKUJI": { name: "ampKUJI", dec: 6 },
    "factory/kujira1n3fr5f56r2ce0s37wdvwrk98yhhq3unnxgcqus8nzsfxvllk0yxquurqty/ampKUJI": { name: "ampKUJI", dec: 6 },
    "factory/kujira175yatpvkpgw07w0chhzuks3zrrae9z9g2y6r7u5pzqesyau4x9eqqyv0rr/ampMNTA": { name: "ampMNTA", dec: 6 },
    "factory/kujira1eqqr3ad0lh84ua4m5qu2n4jjz6h73d64jfwvng0w2k0lnhltt4jqdex4z9/urcpt": { name: "qcKUJI", dec: 6 },
    "factory/kujira1rw2w22jt3r6fl6zdl5gpv7d92vxrmx4tuvr4kgxfmfggklud3cxsxc73rx/urcpt": { name: "qcKUJI", dec: 6 },
    "factory/kujira1m96ucsfpt2yy72w09z2rxjdj38y5qd8lqx5jtggnejmdua2ynpnsxyvjex/urcpt": { name: "qcKUJI", dec: 6 },
    "factory/kujira1qzu3up50auxhqyzfq56znuj8n38q2ra7daaf9ef7vg8gu66jh4fqd2wd2y/urcpt": { name: "qcMNTA", dec: 6 },
    "factory/kujira1l04ged98c7a7s9tllu62ld09ztylwf442qgm4thfgmadrvngeumsz4zrh2/urcpt": { name: "qcFUZN", dec: 6 },
    "factory/kujira15e8q5wzlk5k38gjxlhse3vu6vqnafysncx2ltexd6y9gx50vuj2qpt7dgv/boneKuji": { name: "boneKUJI", dec: 6 },
    "ukuji": { name: "KUJI", dec: 6 },
    "factory/kujira1643jxg8wasy5cfcn7xm8rd742yeazcksqlg4d7/umnta": { name: "MNTA", dec: 6 },
    "factory/kujira1sc6a0347cc5q3k890jj0pf3ylx2s38rh4sza4t/ufuzn": { name: "FUZN", dec: 6 },
    "factory/kujira14qqwk3655csqvcg5ft37z25aped46s86vplma4mstp73r0nuy8dqy2xh84/unut": { name: "NUT", dec: 6 },
    "factory/kujira14qqwk3655csqvcg5ft37z25aped46s86vplma4mstp73r0nuy8dqy2xh84/usnut": { name: "sNUT", dec: 6 },
};

export function denom(denom: string): { name: string, dec: number } | undefined {
    if (denom.startsWith("factory/")) {
        const [_, contract, subdenom] = denom.split("/");
        let chainId = get(savedNetwork).chainId;
        const reserve = RESERVES[chainId]?.[contract];
        if (reserve && subdenom === "ursv") {
            return {
                name: `ux${DENOMS[reserve.baseDenom].name}`,
                dec: DENOMS[reserve.baseDenom].dec,
            }
        }
    }
    return DENOMS[denom];
}