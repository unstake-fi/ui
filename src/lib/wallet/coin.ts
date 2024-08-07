import { DENOMS, denom as _denom } from "$lib/resources/denoms";
import type { Coin } from "@cosmjs/amino";
import BigNumber from "bignumber.js";
import { formatBigNumber } from "./utils";

export class Balance {
  readonly denom: string;
  readonly amount: BigNumber;
  readonly name: string;
  readonly dec: number;
  constructor(coin: Coin) {
    const meta = _denom(coin.denom) ?? { name: coin.denom, dec: 0 };
    this.name = meta.name;
    this.dec = meta.dec;
    this.denom = coin.denom;
    this.amount = new BigNumber(coin.amount);
  }
  static from = (coin: Coin) => new Balance(coin);
  static fromAmountDenom = (amount: string, denom: string) =>
    new Balance({ amount: amount.toString(), denom });
  static fromHuman = (amount: string, denom: string) => {
    const meta = _denom(denom) ?? { name: denom, dec: 0 };
    return new Balance({
      amount: new BigNumber(amount)
        .times(new BigNumber(10).pow(meta.dec))
        .toString(),
      denom,
    });
  };

  public normalized(): BigNumber {
    return this.amount.div(new BigNumber(10).pow(this.dec));
  }

  public humanAmount(decimals: number = 2): string {
    return formatBigNumber(this.normalized(), decimals);
  }

  public humanAmountWithPrecision(precision: number = 2): string {
    return this.normalized().toPrecision(precision);
  }

  public display(decimals?: number): string {
    return `${this.humanAmount(decimals)} ${this.name}`;
  }

  public displayWithPrecision(precision?: number): string {
    return `${this.humanAmountWithPrecision(precision)} ${this.name}`;
  }

  public toCoin(): Coin {
    return { amount: this.amount.toString(), denom: this.denom };
  }

  public toCoins(): Coin[] {
    return [this.toCoin()];
  }

  public known(): boolean {
    return this.name !== this.denom;
  }

  public add(amount: Balance): Balance {
    if (this.denom !== amount.denom)
      throw new Error("Can't add balances of different denoms");
    return new Balance({
      amount: this.amount.plus(amount.amount).toString(),
      denom: this.denom,
    });
  }

  public sub(amount: Balance): Balance {
    if (this.denom !== amount.denom)
      throw new Error("Can't sub balances of different denoms");
    return new Balance({
      amount: this.amount.minus(amount.amount).toString(),
      denom: this.denom,
    });
  }
}

export class Balances {
  constructor(public readonly coins: Balance[]) {}
  static from = (balances: Balance[]) => new Balances(balances);
  static fromCoins = (coins: Coin[]) =>
    new Balances(coins.map((coin) => Balance.from(coin)));
  static fromHuman = (amount: string, denom: string) =>
    Balances.from([Balance.fromHuman(amount, denom)]);

  public get(denom: string): Balance | undefined {
    return this.coins.find((balance) => balance.denom === denom);
  }

  public getOrZero(denom: string): Balance {
    return this.get(denom) ?? Balance.from({ amount: "0", denom });
  }
}
