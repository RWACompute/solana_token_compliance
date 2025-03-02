#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

pub mod instructions;

use instructions::*;

declare_id!("4u4wGUQDzFFh7Hnnk2wt8SN3HkhfcFbRfUyvnjxkTkn8");

#[program]
pub mod token_program {
    use super::*;

    pub fn create_token(
        ctx: Context<CreateToken>,
        token_title: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
        create::create_token(ctx, token_title, token_symbol, token_uri)
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        mint::mint_token(ctx, amount)
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        transfer::transfer_tokens(ctx, amount)
    }
}
