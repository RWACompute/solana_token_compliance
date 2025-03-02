#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA");

#[program]
pub mod modular_compliance {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
