use anchor_lang::prelude::*;

#[account]
pub struct ComplianceState {
    pub authority: Pubkey,
    pub modules: Vec<Pubkey>,
}
