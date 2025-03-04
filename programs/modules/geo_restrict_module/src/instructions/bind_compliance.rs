use crate::state::GeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct BindCompliance<'info> {
    #[account(mut)]
    pub geo_state: Account<'info, GeoState>,
    pub authority: Signer<'info>,
}

pub fn process_bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()> {
    let geo_state = &mut ctx.accounts.geo_state;
    geo_state.compliance_contract = compliance;
    geo_state.is_bound = true;
    msg!("✅ Geo Restriction Module bound.");
    Ok(())
}
