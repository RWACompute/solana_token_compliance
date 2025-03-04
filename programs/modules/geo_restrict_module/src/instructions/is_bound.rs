use crate::state::GeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct IsBound<'info> {
    pub geo_state: Account<'info, GeoState>,
}

pub fn process_is_bound(ctx: Context<IsBound>) -> Result<bool> {
    let geo_state = &ctx.accounts.geo_state;
    Ok(geo_state.is_bound)
}
