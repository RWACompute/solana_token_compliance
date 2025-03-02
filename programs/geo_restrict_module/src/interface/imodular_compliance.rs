use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

pub trait IModularCompliance {
    fn check_compliance(ctx: Context<CheckCompliance>, user_country: String) -> Result<bool>;
    fn bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()>;
    fn unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()>;
    fn is_bound(ctx: Context<IsBound>) -> Result<bool>;
}
