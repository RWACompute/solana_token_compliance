Olá, tenho um projeto inovador de compliance modular.

- O projeto é um programa de compliance modular que permite aos usuários adicionar módulos de compliance conforme necessário. Util para contratos inteligentes RWA Real World Assets. Nosso objetivo é criar um sistema de compliance flexível e personalizável para atender às necessidades específicas de cada projeto.

- O programa principal é o `modular_compliance` e ele é composto por módulos de compliance.

  - O módulo `geo_restrict_module` é um módulo de compliance que permite aos usuários adicionar restrições de geolocalização conforme necessário.
  - O módulo `kyc_module` é um módulo de compliance que permite aos usuários adicionar restrições de know your customer (KYC) conforme necessário.

- O programa `token_program` é um programa que permite aos usuários criar e gerenciar tokens.

O Fluxo de trabalho é o seguinte:

1. O usuário cria um contrato inteligente RWA Real World Assets.
2. O usuário adiciona um módulo ex: `geo_restrict_module` ao contrato inteligente modular_compliance.
3. Token program representa o token do contrato inteligente RWA Real World Assets.
4. Toda vez que um usuario transfere um token, o programa modular_compliance é chamado para verificar se o usuario pode transferir o token com a funcao compliance_check.

detalhes do fluxo de trabalho:

- Toda vez qeu um transfer é chamado o program modular_compliance é chamado para verificar se o usuario pode transferir o token com a funcao compliance_check fazendo CPI para o modulo geo_restrict_module e kyc_module.
- Todos os modulos dentro da pasta modules tem que ter a mesma estrutura programada pela interface. Devem possuir a funcao compliance_check.
- O programa modular_compliance deve fazer CPI para todos os modulos que o usuario adicionou.

Vou lhe passar o codigo do projeto e pedir para voce me ajudar a criar o programa modular_compliance.

segue a estrutura do projeto:

```
└── 📁programs
    └── 📁modular_compliance
        └── Cargo.toml
        └── 📁src
            └── 📁instructions
                └── add_module.rs
                └── check_compliance.rs
                └── initialize.rs
                └── mod.rs
                └── remove_module.rs
            └── 📁interface
                └── imodular_compliance.rs
                └── mod.rs
            └── lib.rs
            └── 📁state
                └── compliance_state.rs
                └── mod.rs
        └── Xargo.toml
    └── 📁modules
        └── 📁geo_restrict_module
            └── Cargo.toml
            └── 📁src
                └── 📁instructions
                    └── bind_compliance.rs
                    └── check_compliance.rs
                    └── initialize.rs
                    └── is_bound.rs
                    └── mod.rs
                    └── set_countries_allowed.rs
                    └── set_user_country.rs
                    └── unbind_compliance.rs
                └── lib.rs
                └── 📁state
                    └── geo_state.rs
                    └── mod.rs
                    └── user_geo_state.rs
            └── Xargo.toml
        └── 📁kyc_module
            └── Cargo.toml
            └── 📁src
                └── lib.rs
            └── Xargo.toml
    └── 📁token_program
        └── Cargo.toml
        └── 📁src
            └── 📁instructions
                └── create.rs
                └── mint.rs
                └── mod.rs
                └── transfer.rs
            └── lib.rs
        └── Xargo.toml
    └── prompt.md
```

vamos por program agora:

modular_compliance:

estrutura:

```
└── 📁modular_compliance
    └── 📁src
        └── 📁instructions
            └── add_module.rs
            └── check_compliance.rs
            └── initialize.rs
            └── mod.rs
            └── remove_module.rs
        └── 📁interface
            └── imodular_compliance.rs
            └── mod.rs
        └── lib.rs
        └── 📁state
            └── compliance_state.rs
            └── mod.rs
    └── Cargo.toml
    └── Xargo.toml
```

// add_module.rs

use crate::state::ComplianceState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct AddModule<'info> { #[account(mut, has_one = authority)]
pub compliance_state: Account<'info, ComplianceState>,
pub authority: Signer<'info>,
}

pub fn process_add_module(ctx: Context<AddModule>, module: Pubkey) -> Result<()> {
let compliance_state = &mut ctx.accounts.compliance_state;
if !compliance_state.modules.contains(&module) {
compliance_state.modules.push(module);
msg!("Módulo de Compliance Adicionado: {:?}", module);
} else {
msg!("Módulo já existente.");
}
Ok(())
}

// check_compliance.rs

use crate::state::ComplianceState;
use anchor_lang::prelude::\*;
use solana_program::instruction::Instruction;
use solana_program::program::invoke;
use solana_program::pubkey::Pubkey;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
pub compliance_state: Account<'info, ComplianceState>,
}

pub fn process_check_compliance(ctx: Context<CheckCompliance>, user: Pubkey) -> Result<bool> {
let compliance_state = &ctx.accounts.compliance_state;

    for module in &compliance_state.modules {
        let is_compliant = check_module_compliance(*module, user)?;
        if !is_compliant {
            return Ok(false);
        }
    }

    Ok(true)

}

fn check_module_compliance(module: Pubkey, user: Pubkey) -> Result<bool> {
let instruction = Instruction {
program_id: module,
accounts: vec![AccountMeta::new_readonly(user, false)],
data: vec![],
};

    match invoke(&instruction, &[]) {
        Ok(_) => Ok(true),
        Err(_) => {
            msg!("🚫 Compliance check failed for module: {}", module);
            Err(ProgramError::Custom(1).into())
        }
    }

}

// initialize.rs

use crate::state::ComplianceState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct Initialize<'info> { #[account(
init,
payer = authority,
space = 8 + 32 + 4 + (32 * 20) // Support up to 20 modules
)]
pub compliance_state: Account<'info, ComplianceState>, #[account(mut)]
pub authority: Signer<'info>,
pub system_program: Program<'info, System>,
}

pub fn process_initialize(ctx: Context<Initialize>) -> Result<()> {
let compliance_state = &mut ctx.accounts.compliance_state;
compliance_state.modules = Vec::new();
compliance_state.authority = ctx.accounts.authority.key();
msg!("Sistema de Compliance Modular Inicializado.");
Ok(())
}

// mod.rs

pub mod add_module;
pub mod check_compliance;
pub mod initialize;
pub mod remove_module;

pub use add*module::*;
pub use check*compliance::*;
pub use initialize::_;
pub use remove_module::_;

// remove_module.rs

use crate::state::ComplianceState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct RemoveModule<'info> { #[account(mut, has_one = authority)]
pub compliance_state: Account<'info, ComplianceState>,
pub authority: Signer<'info>,
}

pub fn process_remove_module(ctx: Context<RemoveModule>, module: Pubkey) -> Result<()> {
let compliance_state = &mut ctx.accounts.compliance_state;
compliance_state.modules.retain(|&m| m != module);
msg!("Módulo de Compliance Removido: {:?}", module);
Ok(())
}

// imodular_compliance.rs

use anchor_lang::prelude::\*;
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

/// Estrutura de contexto para verificar compliance #[derive(Accounts)]
pub struct CheckCompliance<'info> {
pub compliance_module: Account<'info, ComplianceModuleState>,
}

/// Estrutura de contexto para vincular um módulo ao compliance #[derive(Accounts)]
pub struct BindCompliance<'info> { #[account(mut)]
pub compliance_module: Account<'info, ComplianceModuleState>,
pub authority: Signer<'info>,
}

/// Estrutura de contexto para desvincular um módulo do compliance #[derive(Accounts)]
pub struct UnbindCompliance<'info> { #[account(mut)]
pub compliance_module: Account<'info, ComplianceModuleState>,
pub authority: Signer<'info>,
}

/// Estrutura de contexto para verificar se um módulo está vinculado #[derive(Accounts)]
pub struct IsBound<'info> {
pub compliance_module: Account<'info, ComplianceModuleState>,
}

/// Estrutura de armazenamento do estado do módulo #[account]
pub struct ComplianceModuleState {
pub compliance_contract: Pubkey, // Endereço do contrato `modular_compliance`
pub is_bound: bool, // Indica se está vinculado
}

// compliance_state.rs

use anchor_lang::prelude::\*;

#[account]
pub struct ComplianceState {
pub authority: Pubkey,
pub modules: Vec<Pubkey>,
}

// lib.rs

#![allow(unexpected_cfgs)]
use anchor_lang::prelude::\*;

pub mod instructions;
pub mod interface;
pub mod state;

use instructions::add*module::*;
use instructions::check*compliance::*;
use instructions::initialize::_;
use instructions::remove_module::_;

declare_id!("78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN");

#[program]
pub mod modular_compliance {
use super::\*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        process_initialize(ctx)
    }

    pub fn add_module(ctx: Context<AddModule>, module: Pubkey) -> Result<()> {
        process_add_module(ctx, module)
    }

    pub fn remove_module(ctx: Context<RemoveModule>, module: Pubkey) -> Result<()> {
        process_remove_module(ctx, module)
    }

    pub fn check_compliance(ctx: Context<CheckCompliance>, user: Pubkey) -> Result<bool> {
        process_check_compliance(ctx, user)
    }

}

// Cargo.toml

[package]
name = "modular_compliance"
version = "0.1.0"
description = "Compliance Modular para Tokenização"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "modular_compliance"

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build"]

[dependencies]
anchor-lang = "0.30.1"
solana-program = "1.18.26"

types gerado pelo anchor:

```ts
/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/modular_compliance.json`.
 */
export type ModularCompliance = {
  address: "78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN";
  metadata: {
    name: "modularCompliance";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Compliance Modular para Tokenização";
  };
  instructions: [
    {
      name: "addModule";
      discriminator: [81, 183, 101, 212, 17, 241, 122, 204];
      accounts: [
        {
          name: "complianceState";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
          relations: ["complianceState"];
        }
      ];
      args: [
        {
          name: "module";
          type: "pubkey";
        }
      ];
    },
    {
      name: "checkCompliance";
      discriminator: [233, 217, 116, 46, 226, 224, 62, 42];
      accounts: [
        {
          name: "complianceState";
        }
      ];
      args: [
        {
          name: "user";
          type: "pubkey";
        }
      ];
      returns: "bool";
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "complianceState";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "removeModule";
      discriminator: [115, 146, 208, 15, 125, 73, 88, 161];
      accounts: [
        {
          name: "complianceState";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
          relations: ["complianceState"];
        }
      ];
      args: [
        {
          name: "module";
          type: "pubkey";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "complianceState";
      discriminator: [79, 72, 68, 139, 194, 24, 136, 48];
    }
  ];
  types: [
    {
      name: "complianceState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "modules";
            type: {
              vec: "pubkey";
            };
          }
        ];
      };
    }
  ];
};
```

modules/geo_restrict_module:

estrutura:

```
└── 📁geo_restrict_module
    └── 📁src
        └── 📁instructions
            └── bind_compliance.rs
            └── check_compliance.rs
            └── initialize.rs
            └── is_bound.rs
            └── mod.rs
            └── set_countries_allowed.rs
            └── set_user_country.rs
            └── unbind_compliance.rs
        └── lib.rs
        └── 📁state
            └── geo_state.rs
            └── mod.rs
            └── user_geo_state.rs
    └── Cargo.toml
    └── Xargo.toml
```

segue types gerado pelo anchor:

```ts
/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/geo_restrict_module.json`.
 */
export type GeoRestrictModule = {
  address: "HYd7fRvoLw6nxVVZuUsnVy6w8aDDrhUpznCkTQL2D3RY";
  metadata: {
    name: "geoRestrictModule";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "bindCompliance";
      discriminator: [112, 77, 46, 73, 248, 106, 180, 71];
      accounts: [
        {
          name: "geoState";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
        }
      ];
      args: [
        {
          name: "compliance";
          type: "pubkey";
        }
      ];
    },
    {
      name: "checkCompliance";
      discriminator: [233, 217, 116, 46, 226, 224, 62, 42];
      accounts: [
        {
          name: "geoState";
        },
        {
          name: "userGeoState";
        }
      ];
      args: [
        {
          name: "user";
          type: "pubkey";
        }
      ];
      returns: "bool";
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "geoState";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "isBound";
      discriminator: [158, 187, 66, 243, 10, 58, 36, 82];
      accounts: [
        {
          name: "geoState";
        }
      ];
      args: [];
      returns: "bool";
    },
    {
      name: "setRestrictedCountries";
      discriminator: [163, 134, 176, 74, 11, 72, 75, 168];
      accounts: [
        {
          name: "geoState";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
          relations: ["geoState"];
        }
      ];
      args: [
        {
          name: "countries";
          type: {
            vec: "string";
          };
        }
      ];
    },
    {
      name: "setUserCountry";
      discriminator: [53, 66, 181, 152, 105, 182, 81, 108];
      accounts: [
        {
          name: "userGeoState";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 103, 101, 111];
              },
              {
                kind: "account";
                path: "user";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "countryCode";
          type: "string";
        }
      ];
    },
    {
      name: "unbindCompliance";
      discriminator: [99, 81, 217, 30, 35, 91, 100, 54];
      accounts: [
        {
          name: "geoState";
          writable: true;
        },
        {
          name: "authority";
          signer: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "geoState";
      discriminator: [197, 29, 61, 24, 5, 79, 62, 20];
    },
    {
      name: "userGeoState";
      discriminator: [134, 26, 222, 1, 86, 111, 19, 67];
    }
  ];
  types: [
    {
      name: "geoState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "complianceContract";
            type: "pubkey";
          },
          {
            name: "isBound";
            type: "bool";
          },
          {
            name: "restrictedCountries";
            type: {
              vec: "string";
            };
          }
        ];
      };
    },
    {
      name: "userGeoState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "countryCode";
            type: "string";
          }
        ];
      };
    }
  ];
};
```

token_program:

estrutura:

```
└── 📁token_program
    └── 📁src
        └── 📁instructions
            └── create.rs
            └── mint.rs
            └── mod.rs
            └── transfer.rs
        └── lib.rs
    └── Cargo.toml
    └── Xargo.toml
```

// create.rs

use {
anchor_lang::prelude::\*,
anchor_spl::{
metadata::{
create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
CreateMetadataAccountsV3, Metadata,
},
token::{Mint, Token},
},
};

#[derive(Accounts)]
pub struct CreateToken<'info> { #[account(mut)]
pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = payer.key(),
        mint::freeze_authority = payer.key(),

    )]
    pub mint_account: Account<'info, Mint>,

    /// CHECK: Validate address by deriving pda
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), mint_account.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}

pub fn create_token(
ctx: Context<CreateToken>,
token_name: String,
token_symbol: String,
token_uri: String,
) -> Result<()> {
msg!("Creating metadata account");

    // Cross Program Invocation (CPI)
    // Invoking the create_metadata_account_v3 instruction on the token metadata program
    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint_account.to_account_info(),
                mint_authority: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.payer.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name: token_name,
            symbol: token_symbol,
            uri: token_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        false, // Is mutable
        true,  // Update authority is signer
        None,  // Collection details
    )?;

    msg!("Token created successfully.");

    Ok(())

}

// mint.rs

use {
anchor_lang::prelude::\*,
anchor_spl::{
associated_token::AssociatedToken,
token::{mint_to, Mint, MintTo, Token, TokenAccount},
},
};

#[derive(Accounts)]
pub struct MintToken<'info> { #[account(mut)]
pub mint_authority: Signer<'info>,

    pub recipient: SystemAccount<'info>,
    #[account(mut)]
    pub mint_account: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = mint_authority,
        associated_token::mint = mint_account,
        associated_token::authority = recipient,
    )]
    pub associated_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

}

pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
msg!("Minting tokens to associated token account...");
msg!("Mint: {}", &ctx.accounts.mint_account.key());
msg!(
"Token Address: {}",
&ctx.accounts.associated_token_account.key()
);

    // Invoke the mint_to instruction on the token program
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint_account.to_account_info(),
                to: ctx.accounts.associated_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        ),
        amount * 10u64.pow(ctx.accounts.mint_account.decimals as u32), // Mint tokens
    )?;

    msg!("Token minted successfully.");

    Ok(())

}

// mod.rs

pub mod create;
pub mod mint;
pub mod transfer;

pub use create::_;
pub use mint::_;
pub use transfer::\*;

// transfer.rs

#![allow(unexpected_cfgs)]
use anchor_lang::prelude::\*;
use anchor_lang::solana_program::{
account_info::AccountInfo, instruction::Instruction, program::invoke, pubkey::Pubkey,
};
use anchor_spl::{
associated_token::AssociatedToken,
token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use std::str::FromStr;

#[derive(Accounts)]
pub struct TransferTokens<'info> { #[account(mut)]
pub sender: Signer<'info>,

    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub mint_account: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_account,
        associated_token::authority = sender,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint_account,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    /// CHECK: Compliance program para CPI
    #[account(address = Pubkey::new_from_array(
        Pubkey::from_str("78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN").unwrap().to_bytes()
    ))]
    pub compliance_program: UncheckedAccount<'info>,

    /// CHECK: Compliance state passado para o modular_compliance
    #[account(mut)]
    pub compliance_state: AccountInfo<'info>,

}

pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
msg!("Verificando compliance antes da transferência...");

    if ctx.accounts.compliance_state.data_is_empty() {
        msg!("🚨 ComplianceState ainda não foi inicializado!");
        return Err(ProgramError::UninitializedAccount.into());
    }

    // 🔹 **Chamada CPI para modular_compliance**
    let instruction = Instruction {
        program_id: ctx.accounts.compliance_program.key(),
        accounts: vec![
            AccountMeta::new_readonly(ctx.accounts.compliance_state.key(), false),
            AccountMeta::new_readonly(ctx.accounts.sender.key(), false),
        ],
        data: vec![], // Modular Compliance irá chamar os módulos
    };

    let compliance_result = invoke(
        &instruction,
        &[
            ctx.accounts.compliance_program.to_account_info(),
            ctx.accounts.compliance_state.to_account_info(),
        ],
    );

    if compliance_result.is_err() {
        msg!("🚫 Compliance check falhou. Transferência abortada.");
        return Err(ProgramError::Custom(99).into());
    }

    msg!("✅ Compliance verificado! Prosseguindo com a transferência.");

    // 🔹 **Executar a transferência de tokens**
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        ),
        amount * 10u64.pow(ctx.accounts.mint_account.decimals as u32),
    )?;

    msg!("✅ Tokens transferidos com sucesso.");
    Ok(())

}

// lib.rs

#![allow(clippy::result_large_err)] #![allow(unexpected_cfgs)]
use anchor_lang::prelude::\*;

pub mod instructions;

use instructions::\*;

declare_id!("4u4wGUQDzFFh7Hnnk2wt8SN3HkhfcFbRfUyvnjxkTkn8");

#[program]
pub mod token_program {
use super::\*;

    pub fn create_token(
        ctx: Context<CreateToken>,
        token_title: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
        create::create_token(ctx, token_title, token_symbol, token_uri)
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        mint::mint_token(ctx, amount)
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        transfer::transfer_tokens(ctx, amount)
    }

}

// Cargo.toml

[package]
name = "token_program"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "token_program"

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-lang = { version = "0.30.1", features = ["init-if-needed"] }
anchor-spl = { version = "0.30.0", features = [
"metadata",
] } # 🔹 Adicione isso se não estiver presente

modular_compliance = { path = "../modular_compliance", features = ["cpi"] }
solana-program = "1.18.26"

segue o idl gerado pelo anchor:

```ts
/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/token_program.json`.
 */
export type TokenProgram = {
  address: "4u4wGUQDzFFh7Hnnk2wt8SN3HkhfcFbRfUyvnjxkTkn8";
  metadata: {
    name: "tokenProgram";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "createToken";
      discriminator: [84, 52, 204, 228, 24, 140, 234, 75];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "mintAccount";
          writable: true;
          signer: true;
        },
        {
          name: "metadataAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: "account";
                path: "tokenMetadataProgram";
              },
              {
                kind: "account";
                path: "mintAccount";
              }
            ];
            program: {
              kind: "account";
              path: "tokenMetadataProgram";
            };
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "tokenMetadataProgram";
          address: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "tokenTitle";
          type: "string";
        },
        {
          name: "tokenSymbol";
          type: "string";
        },
        {
          name: "tokenUri";
          type: "string";
        }
      ];
    },
    {
      name: "mintToken";
      discriminator: [172, 137, 183, 14, 207, 110, 234, 56];
      accounts: [
        {
          name: "mintAuthority";
          writable: true;
          signer: true;
        },
        {
          name: "recipient";
        },
        {
          name: "mintAccount";
          writable: true;
        },
        {
          name: "associatedTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "recipient";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "mintAccount";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "transferTokens";
      discriminator: [54, 180, 238, 175, 74, 85, 126, 188];
      accounts: [
        {
          name: "sender";
          writable: true;
          signer: true;
        },
        {
          name: "recipient";
          writable: true;
        },
        {
          name: "mintAccount";
          writable: true;
        },
        {
          name: "senderTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "sender";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "mintAccount";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "recipientTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "recipient";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ];
              },
              {
                kind: "account";
                path: "mintAccount";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "complianceProgram";
          address: "78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN";
        },
        {
          name: "complianceState";
          writable: true;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    }
  ];
};
```

De acordo com esse projeto temos o seguinte test:

```ts
import * as anchor from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { GeoRestrictModule } from "../target/types/geo_restrict_module";
import { ModularCompliance } from "../target/types/modular_compliance";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

describe("\n=== Token Program - Transfer Compliance ===\n", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const receiver = Keypair.generate(); // Gerando um novo receiver

  const tokenProgram = anchor.workspace
    .TokenProgram as anchor.Program<TokenProgram>;
  const geoRestrictModule = anchor.workspace
    .GeoRestrictModule as anchor.Program<GeoRestrictModule>;
  const modularCompliance = anchor.workspace
    .ModularCompliance as anchor.Program<ModularCompliance>;

  // Metadados para criação do token
  const metadata = {
    name: "Solana Gold",
    symbol: "GOLDSOL",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  };

  const mintKeypair = new Keypair();
  let complianceState: PublicKey;
  let senderATA: PublicKey;
  let recipientATA: PublicKey;
  let receiverGeoStateKey: PublicKey;

  async function ensureAssociatedTokenAccount(
    mint: PublicKey,
    owner: PublicKey
  ) {
    const associatedTokenAccount = getAssociatedTokenAddressSync(mint, owner);
    const accountInfo = await provider.connection.getAccountInfo(
      associatedTokenAccount
    );

    if (!accountInfo) {
      console.log(
        `🔹 Criando conta de token associada para ${owner.toBase58()}`
      );

      const tx = new anchor.web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          payer.publicKey, // Pagador da taxa
          associatedTokenAccount, // Endereço da conta
          owner, // Dono da conta
          mint // Endereço do mint do token
        )
      );

      await provider.sendAndConfirm(tx, []);
      console.log(
        "✅ Conta de token associada criada:",
        associatedTokenAccount.toBase58()
      );
    } else {
      console.log(
        "🔹 Conta de token associada já existe:",
        associatedTokenAccount.toBase58()
      );
    }

    return associatedTokenAccount;
  }

  before(async () => {
    console.log(
      "\n>>> Configuração inicial: Criando Token, Mintando e Setando Compliance..."
    );

    // Criar o token
    const transactionSignature = await tokenProgram.methods
      .createToken(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        payer: payer.publicKey,
        mintAccount: mintKeypair.publicKey,
      })
      .signers([mintKeypair])
      .rpc();

    console.log(
      "✔ Token criado com sucesso! Transaction:",
      transactionSignature
    );

    // Mintar tokens
    senderATA = await ensureAssociatedTokenAccount(
      mintKeypair.publicKey,
      payer.publicKey
    );
    recipientATA = await ensureAssociatedTokenAccount(
      mintKeypair.publicKey,
      receiver.publicKey
    );

    const mintSignature = await tokenProgram.methods
      .mintToken(new anchor.BN(100))
      .accountsStrict({
        mintAuthority: payer.publicKey,
        recipient: payer.publicKey,
        mintAccount: mintKeypair.publicKey,
        associatedTokenAccount: senderATA,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✔ Mint realizado com sucesso! Transaction:", mintSignature);

    // Inicializar Compliance State
    const stateKeypair = Keypair.generate();
    complianceState = stateKeypair.publicKey;

    const complianceInitTx = await modularCompliance.methods
      .initialize()
      .accountsStrict({
        complianceState,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateKeypair])
      .rpc();

    console.log(
      "✔ ComplianceState inicializado! Transaction:",
      complianceInitTx
    );

    // Adicionar Geo Restriction Module ao Compliance
    const geoRestrictPubkey = geoRestrictModule.programId;
    const complianceAddTx = await modularCompliance.methods
      .addModule(geoRestrictPubkey)
      .accountsStrict({
        complianceState,
        authority: payer.publicKey,
      })
      .rpc();

    console.log(
      "✔ GeoRestrictModule vinculado ao Compliance! Transaction:",
      complianceAddTx
    );
  });

  it("🚫 Registra o usuário na Syria e verifica bloqueio", async () => {
    console.log(">>> Registrando usuário na Syria...");

    receiverGeoStateKey = PublicKey.findProgramAddressSync(
      [Buffer.from("user_geo"), receiver.publicKey.toBuffer()],
      geoRestrictModule.programId
    )[0];

    await geoRestrictModule.methods
      .setUserCountry("Syria")
      .accountsStrict({
        userGeoState: receiverGeoStateKey,
        user: receiver.publicKey,
        authority: payer.publicKey, // quem está cadastrando
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(
      "✔ Usuário registrado na Syria. Address:",
      receiverGeoStateKey.toBase58()
    );

    const userGeoData = await geoRestrictModule.account.userGeoState.fetch(
      receiverGeoStateKey
    );

    console.log("🚨 Verificando país do usuário registrado...");
    console.table({
      user: userGeoData.user.toBase58(),
      country_code: userGeoData.countryCode,
    });

    if (userGeoData.countryCode !== "Syria") {
      throw new Error("🚨 O país registrado está incorreto!");
    }

    console.log("✔ País do usuário corretamente registrado como Syria.");
  });

  it("🚫 Bloqueia a transferência para usuário em país restrito", async () => {
    console.log(">>> Testando bloqueio de transferência...");
    console.table({
      sender: payer.publicKey.toBase58(),
      recipient: receiver.publicKey.toBase58(),
      mintAccount: mintKeypair.publicKey.toBase58(),
      senderTokenAccount: senderATA.toBase58(),
      recipientTokenAccount: recipientATA.toBase58(),
      complianceState: complianceState.toBase58(),
      complianceProgram: modularCompliance.programId.toBase58(),
    });

    try {
      await tokenProgram.methods
        .transferTokens(new anchor.BN(10))
        .accountsStrict({
          sender: payer.publicKey,
          recipient: receiver.publicKey,
          mintAccount: mintKeypair.publicKey,
          senderTokenAccount: senderATA,
          recipientTokenAccount: recipientATA,
          complianceState,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          complianceProgram: modularCompliance.programId,
        })
        .rpc();

      throw new Error("🚨 A transferência NÃO deveria ter sido permitida!");
    } catch (err) {
      console.log("✅ Transferência corretamente bloqueada! 🚫");
      console.error(err);
    }
  });
});
```
