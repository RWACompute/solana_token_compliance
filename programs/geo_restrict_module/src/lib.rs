#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::bind_compliance::*;
use instructions::check_compliance::*;
use instructions::initialize::*;
use instructions::is_bound::*;
use instructions::set_countries_allowed::*;
use instructions::unbind_compliance::*;

declare_id!("HYd7fRvoLw6nxVVZuUsnVy6w8aDDrhUpznCkTQL2D3RY");

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

    pub fn is_bound(ctx: Context<IsBound>) -> Result<bool> {
        process_is_bound(ctx)
    }

    pub fn set_restricted_countries(
        ctx: Context<SetRestrictedCountries>,
        countries: Vec<String>,
    ) -> Result<()> {
        process_set_restricted_countries(ctx, countries)
    }
}
