use anchor_lang::prelude::*;

#[account]
pub struct UserGeoState {
    pub user: Pubkey,
    pub country_code: String,
}
