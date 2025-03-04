#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

pub mod instructions;
pub mod interface;
pub mod state;

use instructions::add_module::*;
use instructions::check_compliance::*;
use instructions::initialize::*;
use instructions::remove_module::*;

declare_id!("78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN");

#[program]
pub mod modular_compliance {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        process_initialize(ctx)
    }

    pub fn add_module(ctx: Context<AddModule>, module: Pubkey) -> Result<()> {
        process_add_module(ctx, module)
    }

    pub fn remove_module(ctx: Context<RemoveModule>, module: Pubkey) -> Result<()> {
        process_remove_module(ctx, module)
    }

    pub fn check_compliance(ctx: Context<CheckCompliance>) -> Result<bool> {
        process_check_compliance(ctx)
    }
}
