use crate::state::GeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetRestrictedCountries<'info> {
    // Ensure that only the account with the pubkey `authority` (stored in geo_state) can modify
    #[account(
        mut,
        has_one = authority
    )]
    pub geo_state: Account<'info, GeoState>,

    pub authority: Signer<'info>,
}

pub fn process_set_restricted_countries(
    ctx: Context<SetRestrictedCountries>,
    countries: Vec<String>,
) -> Result<()> {
    let geo_state = &mut ctx.accounts.geo_state;

    geo_state.restricted_countries = countries;
    msg!(
        "✅ restricted_countries updated: {:?}",
        geo_state.restricted_countries
    );

    Ok(())
}
