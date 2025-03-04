use crate::state::{geo_state::GeoState, user_geo_state::UserGeoState};
use anchor_lang::prelude::*;
use solana_program::program_error::ProgramError;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
    pub geo_state: Account<'info, GeoState>,
    pub user_geo_state: Account<'info, UserGeoState>,
}

pub fn process_check_compliance(ctx: Context<CheckCompliance>, user: Pubkey) -> Result<bool> {
    let geo_state = &ctx.accounts.geo_state;
    let user_geo_state = &ctx.accounts.user_geo_state;

    // 🔍 verify if the user is the same as the user in the UserGeoState
    if user_geo_state.user != user {
        msg!("🚨 Erro: O usuário passado não corresponde ao UserGeoState armazenado!");
        return Err(ProgramError::InvalidArgument.into());
    }

    if geo_state
        .restricted_countries
        .contains(&user_geo_state.country_code)
    {
        msg!(
            "🚫 Transaction blocked for country: {}",
            user_geo_state.country_code
        );
        return Err(ProgramError::Custom(1).into());
    }

    msg!(
        "✅ User allowed in country: {}",
        user_geo_state.country_code
    );
    Ok(true)
}
