use anchor_lang::prelude::*;

// Defines the structure for GeoState, which represents the state of geo-restrictions within the modular compliance program.
#[account]
pub struct GeoState {
    // The address of the `modular_compliance` program.
    pub authority: Pubkey,
    // The address of the compliance State program.
    pub compliance_contract: Pubkey,
    // Indicates whether the geo-restrictions are bound to the compliance program.
    pub is_bound: bool,
    // A list of countries that are restricted.
    pub restricted_countries: Vec<String>,
}
