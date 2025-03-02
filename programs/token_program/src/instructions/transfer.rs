#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    account_info::AccountInfo, instruction::Instruction, program::invoke, pubkey::Pubkey,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use std::str::FromStr; // Import necessário

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = sender,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint_account,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    /// CHECK: Compliance program to be called via CPI
    #[account(address = Pubkey::new_from_array(
        Pubkey::from_str("EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA").unwrap().to_bytes()
    ))]
    pub compliance_program: UncheckedAccount<'info>,

    /// CHECK: Compliance state (passed to the modular_compliance program)
    #[account(mut)]
    pub compliance_state: AccountInfo<'info>,
}

pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
    msg!("Verifying compliance before transfer...");

    // Create instruction for the modular_compliance program
    let instruction = Instruction {
        program_id: ctx.accounts.compliance_program.key(),
        accounts: vec![AccountMeta::new_readonly(
            ctx.accounts.compliance_state.key(),
            false,
        )],
        // Parameters can be added here if needed
        data: vec![],
    };

    // Execute the CPI call to the compliance module
    invoke(
        &instruction,
        &[
            ctx.accounts.compliance_program.to_account_info(),
            ctx.accounts.compliance_state.to_account_info(),
        ],
    )?;

    msg!("Compliance verificado com sucesso! Prosseguindo com a transferência.");

    // Now we can execute the transfer
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        ),
        amount * 10u64.pow(ctx.accounts.mint_account.decimals as u32),
    )?;

    msg!("Tokens transferidos com sucesso.");
    Ok(())
}
