use crate::state::ComplianceState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RemoveModule<'info> {
    #[account(mut, has_one = authority)]
    pub compliance_state: Account<'info, ComplianceState>,
    pub authority: Signer<'info>,
}

pub fn process_remove_module(ctx: Context<RemoveModule>, module: Pubkey) -> Result<()> {
    let compliance_state = &mut ctx.accounts.compliance_state;
    compliance_state.modules.retain(|&m| m != module);
    msg!("Módulo de Compliance Removido: {:?}", module);
    Ok(())
}
