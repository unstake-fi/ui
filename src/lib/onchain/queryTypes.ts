export type ControllerStatus = {
    total_base: string;
    total_quote: string;
    reserve_available: string;
    reserve_deployed: string;
};

export type ControllerRates = {
    vault_debt: string;
    vault_interest: string;
    vault_max_interest: string;
    provider_redemption: string;
};

export type Offer = {
    amount: string;
    fee: string;
  };