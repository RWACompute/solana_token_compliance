use crate::state::GeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 128)]
    // Espaço maior para armazenar países bloqueados
    pub geo_state: Account<'info, GeoState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_initialize(ctx: Context<Initialize>) -> Result<()> {
    let geo_state = &mut ctx.accounts.geo_state;
    geo_state.compliance_contract = Pubkey::default(); // Sem contrato de compliance vinculado ainda
    geo_state.is_bound = false;
    geo_state.restricted_countries = Vec::new(); // Começa sem restrições

    msg!("✅ Geo Restriction Module Initialized.");
    Ok(())
}
