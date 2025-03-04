use crate::state::ComplianceState;
use anchor_lang::prelude::*;
use solana_program::instruction::Instruction;
use solana_program::program::invoke;
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
    #[account(mut)]
    pub compliance_state: Account<'info, ComplianceState>,

    /// CHECK: Este account será passado dinamicamente para os módulos
    #[account(signer)]
    pub user: UncheckedAccount<'info>,

    /// CHECK: O estado do usuário no módulo de geolocalização
    #[account(mut)]
    pub user_geo_state: UncheckedAccount<'info>,
}

pub fn process_check_compliance(ctx: Context<CheckCompliance>) -> Result<bool> {
    let compliance_state = &ctx.accounts.compliance_state;

    for module in &compliance_state.modules {
        let is_compliant = check_module_compliance(
            *module,
            ctx.accounts.user.key(),
            ctx.accounts.user_geo_state.key(),
        )?;
        if !is_compliant {
            return Ok(false);
        }
    }

    Ok(true)
}

fn check_module_compliance(module: Pubkey, user: Pubkey, user_geo_state: Pubkey) -> Result<bool> {
    let instruction = Instruction {
        program_id: module,
        accounts: vec![
            AccountMeta::new_readonly(user, false),
            AccountMeta::new_readonly(user_geo_state, false),
        ],
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
