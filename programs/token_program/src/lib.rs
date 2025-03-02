#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("6WdJw7xm3HApNZcNCXrdo5pApiUjjWyVsCsLgDVbi3MH");

#[program]
pub mod token_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
