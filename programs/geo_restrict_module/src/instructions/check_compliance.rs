use crate::state::GeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
    pub geo_state: Account<'info, GeoState>,
}

pub fn process_check_compliance(
    ctx: Context<CheckCompliance>,
    user_country: String,
) -> Result<bool> {
    let geo_state = &ctx.accounts.geo_state;

    if geo_state.restricted_countries.contains(&user_country) {
        msg!("🚫 Transaction blocked for country: {}", user_country);
        return Ok(false);
    }

    msg!("✅  User allowed in country: {}", user_country);
    Ok(true)
}
