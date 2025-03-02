#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("93r3snAcjiLiAkjN3yNdqgxnhbetVGMm4rGrxPSkdbft");

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
