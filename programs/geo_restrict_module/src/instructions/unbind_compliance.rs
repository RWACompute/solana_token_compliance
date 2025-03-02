use crate::state::GeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UnbindCompliance<'info> {
    #[account(mut)]
    pub geo_state: Account<'info, GeoState>,
    pub authority: Signer<'info>,
}

pub fn process_unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()> {
    let geo_state = &mut ctx.accounts.geo_state;
    geo_state.is_bound = false;
    msg!("✅ Geo Restriction Module unbound.");
    Ok(())
}
