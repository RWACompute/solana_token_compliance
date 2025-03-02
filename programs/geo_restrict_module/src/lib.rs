use anchor_lang::prelude::*;

pub mod instructions;
pub mod interface;
pub mod state;

use instructions::bind_compliance::*;
use instructions::check_compliance::*;
use instructions::initialize::*;
use instructions::unbind_compliance::*;

declare_id!("scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe");

#[program]
pub mod geo_restrict_module {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        process_initialize(ctx)
    }

    pub fn check_compliance(ctx: Context<CheckCompliance>, user_country: String) -> Result<bool> {
        process_check_compliance(ctx, user_country)
    }

    pub fn bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()> {
        process_bind_compliance(ctx, compliance)
    }

    pub fn unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()> {
        process_unbind_compliance(ctx)
    }
}
