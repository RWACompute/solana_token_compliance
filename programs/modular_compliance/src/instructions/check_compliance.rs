use crate::state::ComplianceState;
use anchor_lang::prelude::*;
use solana_program::instruction::Instruction;
use solana_program::program::invoke;
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
    pub compliance_state: Account<'info, ComplianceState>,
}

pub fn process_check_compliance(ctx: Context<CheckCompliance>, user: Pubkey) -> Result<bool> {
    let compliance_state = &ctx.accounts.compliance_state;

    for module in &compliance_state.modules {
        let is_compliant = check_module_compliance(*module, user)?;
        if !is_compliant {
            return Ok(false);
        }
    }

    Ok(true)
}

fn check_module_compliance(module: Pubkey, user: Pubkey) -> Result<bool> {
    let instruction = Instruction {
        program_id: module,
        accounts: vec![AccountMeta::new_readonly(user, false)],
        data: vec![],
    };

    match invoke(&instruction, &[]) {
        Ok(_) => Ok(true),
        Err(_) => {
            msg!("🚫 Compliance check failed for module: {}", module);
            Err(ProgramError::Custom(1).into())
        }
    }
}
