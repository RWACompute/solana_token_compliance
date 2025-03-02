use crate::state::ComplianceState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 64)]
    pub compliance_state: Account<'info, ComplianceState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_initialize(ctx: Context<Initialize>) -> Result<()> {
    let compliance_state = &mut ctx.accounts.compliance_state;
    compliance_state.modules = Vec::new();
    compliance_state.authority = ctx.accounts.authority.key();
    msg!("Sistema de Compliance Modular Inicializado.");
    Ok(())
}
