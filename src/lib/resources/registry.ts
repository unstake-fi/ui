import IconFuzn from "$lib/components/icons/IconFUZN.svelte";
import IconKuji from "$lib/components/icons/IconKUJI.svelte";
import IconMnta from "$lib/components/icons/IconMNTA.svelte";
import IconampKuji from "$lib/components/icons/IconampKUJI.svelte";
import IconampMnta from "$lib/components/icons/IconampMNTA.svelte";
import IconboneKuji from "$lib/components/icons/IconboneKUJI.svelte";
import IconqcFuzn from "$lib/components/icons/IconqcFUZN.svelte";
import IconqcKuji from "$lib/components/icons/IconqcKUJI.svelte";
import IconqcMnta from "$lib/components/icons/IconqcMNTA.svelte";
import type { ComponentType } from "svelte";
import { MAINNET, POND, TESTNET, type NETWORK } from "./networks";

export const MEMO = "Powered by https://unstake.fi";

export const ICONS: Record<string, ComponentType> = {
    "factory/kujira1hf3898lecj8lawxq8nwqczegrla9denzfkx4asjg0q27cyes44sq68gvc9/ampKUJI":
        IconampKuji,

    "factory/kujira1n3fr5f56r2ce0s37wdvwrk98yhhq3unnxgcqus8nzsfxvllk0yxquurqty/ampKUJI":
        IconampKuji,

    "factory/kujira175yatpvkpgw07w0chhzuks3zrrae9z9g2y6r7u5pzqesyau4x9eqqyv0rr/ampMNTA":
        IconampMnta,

    "factory/kujira1eqqr3ad0lh84ua4m5qu2n4jjz6h73d64jfwvng0w2k0lnhltt4jqdex4z9/urcpt":
        IconqcKuji,

    "factory/kujira1rw2w22jt3r6fl6zdl5gpv7d92vxrmx4tuvr4kgxfmfggklud3cxsxc73rx/urcpt":
        IconqcKuji,

    "factory/kujira1m96ucsfpt2yy72w09z2rxjdj38y5qd8lqx5jtggnejmdua2ynpnsxyvjex/urcpt":
        IconqcKuji,

    "factory/kujira1qzu3up50auxhqyzfq56znuj8n38q2ra7daaf9ef7vg8gu66jh4fqd2wd2y/urcpt":
        IconqcMnta,

    "factory/kujira1l04ged98c7a7s9tllu62ld09ztylwf442qgm4thfgmadrvngeumsz4zrh2/urcpt":
        IconqcFuzn,

    "factory/kujira15e8q5wzlk5k38gjxlhse3vu6vqnafysncx2ltexd6y9gx50vuj2qpt7dgv/boneKuji":
        IconboneKuji,
    "ukuji": IconKuji,
    "factory/kujira1643jxg8wasy5cfcn7xm8rd742yeazcksqlg4d7/umnta": IconMnta,
    "factory/kujira1sc6a0347cc5q3k890jj0pf3ylx2s38rh4sza4t/ufuzn": IconFuzn,
};

export type ControllerConfig = {
    address: string;
    askDenom: string;
    offerDenom: string;
};

const mainnetControllers: Record<string, ControllerConfig> = {
    "kujira1x0rx0543jpjfpuskusaca54d2t8f6v6m3eaqwpgahxtmq7kc7vls2j3hth": {
        address: "kujira1x0rx0543jpjfpuskusaca54d2t8f6v6m3eaqwpgahxtmq7kc7vls2j3hth",
        askDenom: "factory/kujira1n3fr5f56r2ce0s37wdvwrk98yhhq3unnxgcqus8nzsfxvllk0yxquurqty/ampKUJI",
        offerDenom: "ukuji",
    },
    "kujira1hmk8wy7vk0v0vpqasv6zv7hm3n2vce4m3yzkns6869j8h4u5qk2q0xndku": {
        address: "kujira1hmk8wy7vk0v0vpqasv6zv7hm3n2vce4m3yzkns6869j8h4u5qk2q0xndku",
        askDenom: "factory/kujira1m96ucsfpt2yy72w09z2rxjdj38y5qd8lqx5jtggnejmdua2ynpnsxyvjex/urcpt",
        offerDenom: "ukuji",
    },
    "kujira1ql30ep2a4f3cswhrr8sjp54t56l7qz7n7jzcnux2m286k6ev7s8q6m8jnp": {
        address: "kujira1ql30ep2a4f3cswhrr8sjp54t56l7qz7n7jzcnux2m286k6ev7s8q6m8jnp",
        askDenom: "factory/kujira1qzu3up50auxhqyzfq56znuj8n38q2ra7daaf9ef7vg8gu66jh4fqd2wd2y/urcpt",
        offerDenom: "factory/kujira1643jxg8wasy5cfcn7xm8rd742yeazcksqlg4d7/umnta",
    },
    "kujira1t2nmpazlpacazde340k5rmmx6dpa49067fdqu3pzskgh9x3lj78qelrvv4": {
        address: "kujira1t2nmpazlpacazde340k5rmmx6dpa49067fdqu3pzskgh9x3lj78qelrvv4",
        askDenom: "factory/kujira1l04ged98c7a7s9tllu62ld09ztylwf442qgm4thfgmadrvngeumsz4zrh2/urcpt",
        offerDenom: "factory/kujira1sc6a0347cc5q3k890jj0pf3ylx2s38rh4sza4t/ufuzn",
    },
    "kujira1m8jew3hlmg2s9c2wqjvv0l30xdfes5lnvrdkt58qzsvf3d3thecqn0pez3": {
        address: "kujira1m8jew3hlmg2s9c2wqjvv0l30xdfes5lnvrdkt58qzsvf3d3thecqn0pez3",
        askDenom: "factory/kujira175yatpvkpgw07w0chhzuks3zrrae9z9g2y6r7u5pzqesyau4x9eqqyv0rr/ampMNTA",
        offerDenom: "factory/kujira1643jxg8wasy5cfcn7xm8rd742yeazcksqlg4d7/umnta",
    },
    "kujira1f49t5dn6xyfrxafxjujrdm0ents85536mdkum4pmlymycwnn9y0q5v86za": {
        address: "kujira1f49t5dn6xyfrxafxjujrdm0ents85536mdkum4pmlymycwnn9y0q5v86za",
        askDenom: "factory/kujira15e8q5wzlk5k38gjxlhse3vu6vqnafysncx2ltexd6y9gx50vuj2qpt7dgv/boneKuji",
        offerDenom: "ukuji",
    },
};

const testnetControllers: Record<string, ControllerConfig> = {
    "kujira1zp30sm7z078pyprelwq4at0za4tz7xrrwdrv0xnmxl0s4sl9dwnserwaem": {
        address: "kujira1zp30sm7z078pyprelwq4at0za4tz7xrrwdrv0xnmxl0s4sl9dwnserwaem",
        askDenom: "factory/kujira1hf3898lecj8lawxq8nwqczegrla9denzfkx4asjg0q27cyes44sq68gvc9/ampKUJI",
        offerDenom: "ukuji",
    },
    "kujira1uat2f4mpyygv26gexhan6vuv5k00j9vjgdmg6047zg3z554se90quuhqsy": {
        address: "kujira1uat2f4mpyygv26gexhan6vuv5k00j9vjgdmg6047zg3z554se90quuhqsy",
        askDenom: "factory/kujira1rw2w22jt3r6fl6zdl5gpv7d92vxrmx4tuvr4kgxfmfggklud3cxsxc73rx/urcpt",
        offerDenom: "ukuji",
    },
}

export const CONTROLLERS: Record<NETWORK, typeof mainnetControllers> = {
    [MAINNET]: mainnetControllers,
    [TESTNET]: testnetControllers,
    [POND]: {},
}