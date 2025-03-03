use crate::state::user_geo_state::UserGeoState;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetUserCountry<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"user_geo", user.key().as_ref()],
        bump, // 👈 Adiciona explicitamente o bump
        space = 8 + 32 + 10 // 8: discriminador; 32: Pubkey; 10: country_code
    )]
    pub user_geo_state: Account<'info, UserGeoState>,

    /// CHECK: PDA gerado baseado no Pubkey do usuário, sem validação externa necessária.
    #[account(mut)]
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_set_user_country(ctx: Context<SetUserCountry>, country_code: String) -> Result<()> {
    let user_geo_state = &mut ctx.accounts.user_geo_state;
    user_geo_state.user = ctx.accounts.user.key();
    user_geo_state.country_code = country_code;

    msg!("✅ UserGeoState updated: {}", user_geo_state.country_code);
    Ok(())
}
