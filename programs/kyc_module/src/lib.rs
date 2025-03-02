#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("BXGeVsqLrbTQ7dPAd1a12bA7zuewNKHi3rPpaF7qWov7");

#[program]
pub mod kyc_module {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
