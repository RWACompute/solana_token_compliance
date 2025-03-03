use crate::state::{geo_state::GeoState, user_geo_state::UserGeoState};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
    pub geo_state: Account<'info, GeoState>,
    pub user_geo_state: Account<'info, UserGeoState>,
}

pub fn process_check_compliance(ctx: Context<CheckCompliance>) -> Result<bool> {
    let geo_state = &ctx.accounts.geo_state;
    let user_country = &ctx.accounts.user_geo_state.country_code;

    if geo_state.restricted_countries.contains(user_country) {
        msg!("🚫 Transaction blocked for country: {}", user_country);
        return Ok(false);
    }
    msg!("✅ User allowed in country: {}", user_country);
    Ok(true)
}
