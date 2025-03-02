use crate::state::ComplianceState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddModule<'info> {
    #[account(mut, has_one = authority)]
    pub compliance_state: Account<'info, ComplianceState>,
    pub authority: Signer<'info>,
}

pub fn process_add_module(ctx: Context<AddModule>, module: Pubkey) -> Result<()> {
    let compliance_state = &mut ctx.accounts.compliance_state;
    if !compliance_state.modules.contains(&module) {
        compliance_state.modules.push(module);
        msg!("Módulo de Compliance Adicionado: {:?}", module);
    } else {
        msg!("Módulo já existente.");
    }
    Ok(())
}
