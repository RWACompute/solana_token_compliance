use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

/// Trait que define a interface para módulos de compliance
pub trait IModularCompliance {
    /// Verifica se um usuário está em conformidade com o módulo
    fn check_compliance(ctx: Context<CheckCompliance>, user: Pubkey) -> Result<bool>;

    /// Vincula este módulo ao programa `modular_compliance`
    fn bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()>;

    /// Desvincula este módulo do programa `modular_compliance`
    fn unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()>;

    /// Retorna se o módulo está vinculado ao compliance
    fn is_bound(ctx: Context<IsBound>) -> Result<bool>;
}

/// Estrutura de contexto para verificar compliance
#[derive(Accounts)]
pub struct CheckCompliance<'info> {
    pub compliance_module: Account<'info, ComplianceModuleState>,
}

/// Estrutura de contexto para vincular um módulo ao compliance
#[derive(Accounts)]
pub struct BindCompliance<'info> {
    #[account(mut)]
    pub compliance_module: Account<'info, ComplianceModuleState>,
    pub authority: Signer<'info>,
}

/// Estrutura de contexto para desvincular um módulo do compliance
#[derive(Accounts)]
pub struct UnbindCompliance<'info> {
    #[account(mut)]
    pub compliance_module: Account<'info, ComplianceModuleState>,
    pub authority: Signer<'info>,
}

/// Estrutura de contexto para verificar se um módulo está vinculado
#[derive(Accounts)]
pub struct IsBound<'info> {
    pub compliance_module: Account<'info, ComplianceModuleState>,
}

/// Estrutura de armazenamento do estado do módulo
#[account]
pub struct ComplianceModuleState {
    pub compliance_contract: Pubkey, // Endereço do contrato `modular_compliance`
    pub is_bound: bool,              // Indica se está vinculado
}
