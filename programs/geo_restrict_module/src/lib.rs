#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe");

#[program]
pub mod geo_restrict_module {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
