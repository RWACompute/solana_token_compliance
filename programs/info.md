entenda o meu proejto primeiro!

Meu projeto é um conjunto de programs para fazer compliances baseado no erc 3643

segue anchor.toml:

[toolchain]

[workspace]
members = [
"programs/geo_restrict_module",
"programs/kyc_module",
"programs/modular_compliance",
"programs/token_program",
]

[features]
resolution = true
skip-lint = false

[programs.localnet]
modular_compliance = "EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA"
kyc_module = "BXGeVsqLrbTQ7dPAd1a12bA7zuewNKHi3rPpaF7qWov7"
geo_restrict_module = "scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe"
token_program = "6dnVzedfGB2cEFxvEHN9bcAbBPJ5wQQRTRZkgpN9j1bn"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "./wallets/phantom-keypair.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/\*_/_.ts"

temos 4 programs

```
└── 📁programs
    └── 📁geo_restrict_module
        └── Cargo.toml
        └── 📁src
            └── 📁instructions
                └── bind_compliance.rs
                └── check_compliance.rs
                └── initialize.rs
                └── is_bound.rs
                └── mod.rs
                └── unbind_compliance.rs
            └── lib.rs
            └── 📁state
                └── geo_state.rs
                └── mod.rs
        └── Xargo.toml
    └── 📁kyc_module
        └── Cargo.toml
        └── 📁src
            └── lib.rs
        └── Xargo.toml
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
```

Vamos falar do primeiro: geo_restrict_module

// bind_compliance.rs

use crate::state::GeoState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct BindCompliance<'info> { #[account(mut)]
pub geo_state: Account<'info, GeoState>,
pub authority: Signer<'info>,
}

pub fn process_bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()> {
let geo_state = &mut ctx.accounts.geo_state;
geo_state.compliance_contract = compliance;
geo_state.is_bound = true;
msg!("✅ Geo Restriction Module bound.");
Ok(())
}

// check_compliance.rs

use crate::state::GeoState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct CheckCompliance<'info> {
pub geo_state: Account<'info, GeoState>,
}

pub fn process_check_compliance(
ctx: Context<CheckCompliance>,
user_country: String,
) -> Result<bool> {
let geo_state = &ctx.accounts.geo_state;

    if geo_state.restricted_countries.contains(&user_country) {
        msg!("🚫 Transaction blocked for country: {}", user_country);
        return Ok(false);
    }

    msg!("✅  User allowed in country: {}", user_country);
    Ok(true)

}

// initialize.rs

use crate::state::GeoState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct Initialize<'info> { #[account(init, payer = authority, space = 8 + 128)]
pub geo_state: Account<'info, GeoState>, #[account(mut)]
pub authority: Signer<'info>,
pub system_program: Program<'info, System>,
}

pub fn process_initialize(ctx: Context<Initialize>) -> Result<()> {
let geo_state = &mut ctx.accounts.geo_state;
geo_state.compliance_contract = Pubkey::default();
geo_state.is_bound = false;
geo_state.restricted_countries = Vec::new();

    msg!("✅ Geo Restriction Module Initialized.");
    Ok(())

}

// is_bound.rs

use crate::state::GeoState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct IsBound<'info> {
pub geo_state: Account<'info, GeoState>,
}

pub fn process_is_bound(ctx: Context<IsBound>) -> Result<bool> {
let geo_state = &ctx.accounts.geo_state;
Ok(geo_state.is_bound)
}

// mod.rs

pub mod bind_compliance;
pub mod check_compliance;
pub mod initialize;
pub mod is_bound;
pub mod unbind_compliance;

pub use bind_compliance::_;
pub use check_compliance::_;
pub use initialize::_;
pub use is_bound::_;
pub use unbind_compliance::\*;

// unbind_compliance.rs

use crate::state::GeoState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct UnbindCompliance<'info> { #[account(mut)]
pub geo_state: Account<'info, GeoState>,
pub authority: Signer<'info>,
}

pub fn process_unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()> {
let geo_state = &mut ctx.accounts.geo_state;
geo_state.is_bound = false;
msg!("✅ Geo Restriction Module unbound.");
Ok(())
}

// geo_state.rs

use anchor_lang::prelude::\*;

// Defines the structure for GeoState, which represents the state of geo-restrictions within the modular compliance program. #[account]
pub struct GeoState {
// The address of the `modular_compliance` program.
pub compliance_contract: Pubkey,
// Indicates whether the geo-restrictions are bound to the compliance program.
pub is_bound: bool,
// A list of countries that are restricted.
pub restricted_countries: Vec<String>,
}

// mod.rs

pub mod geo_state;

pub use geo_state::\*;

// lib.rs

#![allow(unexpected_cfgs)]
use anchor_lang::prelude::\*;

pub mod instructions;
pub mod state;

use instructions::bind_compliance::_;
use instructions::check_compliance::_;
use instructions::initialize::_;
use instructions::is_bound::_;
use instructions::unbind_compliance::\*;

declare_id!("scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe");

#[program]
pub mod geo_restrict_module {
use super::\*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        process_initialize(ctx)
    }

    pub fn check_compliance(ctx: Context<CheckCompliance>, user_country: String) -> Result<bool> {
        process_check_compliance(ctx, user_country)
    }

    pub fn bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()> {
        process_bind_compliance(ctx, compliance)
    }

    pub fn unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()> {
        process_unbind_compliance(ctx)
    }

    pub fn is_bound(ctx: Context<IsBound>) -> Result<bool> {
        process_is_bound(ctx)
    }

}

// Cargo.toml

[package]
name = "geo_restrict_module"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "geo_restrict_module"

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

e o typagem gerado pelo anchor:

/\*\*

- Program IDL in camelCase format in order to be used in JS/TS.
-
- Note that this is only a type helper and is not the actual IDL. The original
- IDL can be found at `target/idl/geo_restrict_module.json`.
  \*/
  export type GeoRestrictModule = {
  "address": "scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe",
  "metadata": {
  "name": "geoRestrictModule",
  "version": "0.1.0",
  "spec": "0.1.0",
  "description": "Created with Anchor"
  },
  "instructions": [
  {
  "name": "bindCompliance",
  "discriminator": [
  112,
  77,
  46,
  73,
  248,
  106,
  180,
  71
  ],
  "accounts": [
  {
  "name": "geoState",
  "writable": true
  },
  {
  "name": "authority",
  "signer": true
  }
  ],
  "args": [
  {
  "name": "compliance",
  "type": "pubkey"
  }
  ]
  },
  {
  "name": "checkCompliance",
  "discriminator": [
  233,
  217,
  116,
  46,
  226,
  224,
  62,
  42
  ],
  "accounts": [
  {
  "name": "geoState"
  }
  ],
  "args": [
  {
  "name": "userCountry",
  "type": "string"
  }
  ],
  "returns": "bool"
  },
  {
  "name": "initialize",
  "discriminator": [
  175,
  175,
  109,
  31,
  13,
  152,
  155,
  237
  ],
  "accounts": [
  {
  "name": "geoState",
  "writable": true,
  "signer": true
  },
  {
  "name": "authority",
  "writable": true,
  "signer": true
  },
  {
  "name": "systemProgram",
  "address": "11111111111111111111111111111111"
  }
  ],
  "args": []
  },
  {
  "name": "isBound",
  "discriminator": [
  158,
  187,
  66,
  243,
  10,
  58,
  36,
  82
  ],
  "accounts": [
  {
  "name": "geoState"
  }
  ],
  "args": [],
  "returns": "bool"
  },
  {
  "name": "unbindCompliance",
  "discriminator": [
  99,
  81,
  217,
  30,
  35,
  91,
  100,
  54
  ],
  "accounts": [
  {
  "name": "geoState",
  "writable": true
  },
  {
  "name": "authority",
  "signer": true
  }
  ],
  "args": []
  }
  ],
  "accounts": [
  {
  "name": "geoState",
  "discriminator": [
  197,
  29,
  61,
  24,
  5,
  79,
  62,
  20
  ]
  }
  ],
  "types": [
  {
  "name": "geoState",
  "type": {
  "kind": "struct",
  "fields": [
  {
  "name": "complianceContract",
  "type": "pubkey"
  },
  {
  "name": "isBound",
  "type": "bool"
  },
  {
  "name": "restrictedCountries",
  "type": {
  "vec": "string"
  }
  }
  ]
  }
  }
  ]
  };

Agora vamos falar de modular_compliance program:

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

segue codigos:

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
let \_accounts: Vec<AccountInfo> = vec![];

    let instruction = Instruction {
        program_id: module,
        accounts: vec![AccountMeta::new(user, false)],
        data: vec![],
    };

    invoke(&instruction, &[]).map_err(|_| ProgramError::Custom(1))?;
    Ok(true)

}

// initialize.rs

use crate::state::ComplianceState;
use anchor_lang::prelude::\*;

#[derive(Accounts)]
pub struct Initialize<'info> { #[account(init, payer = authority, space = 8 + 64)]
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

pub use add_module::_;
pub use check_compliance::_;
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

// mod.rs

pub mod imodular_compliance;

pub use imodular_compliance::\*;

// compliance_state.rs

use anchor_lang::prelude::\*;

#[account]
pub struct ComplianceState {
pub authority: Pubkey,
pub modules: Vec<Pubkey>,
}

// mod.rs

pub mod compliance_state;

pub use compliance_state::\*;

// lib.rs

#![allow(unexpected_cfgs)]
use anchor_lang::prelude::\*;

pub mod instructions;
pub mod interface;
pub mod state;

use instructions::add_module::_;
use instructions::check_compliance::_;
use instructions::initialize::_;
use instructions::remove_module::_;

declare_id!("EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA");

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

e segue typagem gerado pelo anchor:

/\*\*

- Program IDL in camelCase format in order to be used in JS/TS.
-
- Note that this is only a type helper and is not the actual IDL. The original
- IDL can be found at `target/idl/modular_compliance.json`.
  \*/
  export type ModularCompliance = {
  "address": "EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA",
  "metadata": {
  "name": "modularCompliance",
  "version": "0.1.0",
  "spec": "0.1.0",
  "description": "Compliance Modular para Tokenização"
  },
  "instructions": [
  {
  "name": "addModule",
  "discriminator": [
  81,
  183,
  101,
  212,
  17,
  241,
  122,
  204
  ],
  "accounts": [
  {
  "name": "complianceState",
  "writable": true
  },
  {
  "name": "authority",
  "signer": true,
  "relations": [
  "complianceState"
  ]
  }
  ],
  "args": [
  {
  "name": "module",
  "type": "pubkey"
  }
  ]
  },
  {
  "name": "checkCompliance",
  "discriminator": [
  233,
  217,
  116,
  46,
  226,
  224,
  62,
  42
  ],
  "accounts": [
  {
  "name": "complianceState"
  }
  ],
  "args": [
  {
  "name": "user",
  "type": "pubkey"
  }
  ],
  "returns": "bool"
  },
  {
  "name": "initialize",
  "discriminator": [
  175,
  175,
  109,
  31,
  13,
  152,
  155,
  237
  ],
  "accounts": [
  {
  "name": "complianceState",
  "writable": true,
  "signer": true
  },
  {
  "name": "authority",
  "writable": true,
  "signer": true
  },
  {
  "name": "systemProgram",
  "address": "11111111111111111111111111111111"
  }
  ],
  "args": []
  },
  {
  "name": "removeModule",
  "discriminator": [
  115,
  146,
  208,
  15,
  125,
  73,
  88,
  161
  ],
  "accounts": [
  {
  "name": "complianceState",
  "writable": true
  },
  {
  "name": "authority",
  "signer": true,
  "relations": [
  "complianceState"
  ]
  }
  ],
  "args": [
  {
  "name": "module",
  "type": "pubkey"
  }
  ]
  }
  ],
  "accounts": [
  {
  "name": "complianceState",
  "discriminator": [
  79,
  72,
  68,
  139,
  194,
  24,
  136,
  48
  ]
  }
  ],
  "types": [
  {
  "name": "complianceState",
  "type": {
  "kind": "struct",
  "fields": [
  {
  "name": "authority",
  "type": "pubkey"
  },
  {
  "name": "modules",
  "type": {
  "vec": "pubkey"
  }
  }
  ]
  }
  }
  ]
  };

Esse contrato é o contrato principal modular compliance que adiciona outros programs modules de compliances como o geo_restrict_module

E por ultimo o token responsavel para rodar na rede que representa um ativo como um imovel:

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

#![allow(clippy::result_large_err)] #![allow(unexpected_cfgs)]
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

#![allow(clippy::result_large_err)] #![allow(unexpected_cfgs)]
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
use std::str::FromStr; // Import necessário

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

    /// CHECK: Compliance program to be called via CPI
    #[account(address = Pubkey::new_from_array(
        Pubkey::from_str("EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA").unwrap().to_bytes()
    ))]
    pub compliance_program: UncheckedAccount<'info>,

    /// CHECK: Compliance state (passed to the modular_compliance program)
    #[account(mut)]
    pub compliance_state: AccountInfo<'info>,

}

pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
msg!("Verifying compliance before transfer...");

    // Create instruction for the modular_compliance program
    let instruction = Instruction {
        program_id: ctx.accounts.compliance_program.key(),
        accounts: vec![AccountMeta::new_readonly(
            ctx.accounts.compliance_state.key(),
            false,
        )],
        // Parameters can be added here if needed
        data: vec![],
    };

    // Execute the CPI call to the compliance module
    invoke(
        &instruction,
        &[
            ctx.accounts.compliance_program.to_account_info(),
            ctx.accounts.compliance_state.to_account_info(),
        ],
    )?;

    msg!("Compliance verificado com sucesso! Prosseguindo com a transferência.");

    // Now we can execute the transfer
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

    msg!("Tokens transferidos com sucesso.");
    Ok(())

}

// lib.rs

#![allow(clippy::result_large_err)] #![allow(unexpected_cfgs)]
use anchor_lang::prelude::\*;

pub mod instructions;

use instructions::\*;

declare_id!("6dnVzedfGB2cEFxvEHN9bcAbBPJ5wQQRTRZkgpN9j1bn");

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
anchor-spl = { version = "0.30.1", features = ["metadata"] }
modular_compliance = { path = "../modular_compliance" }

e a typagem:

/\*\*

- Program IDL in camelCase format in order to be used in JS/TS.
-
- Note that this is only a type helper and is not the actual IDL. The original
- IDL can be found at `target/idl/token_program.json`.
  \*/
  export type TokenProgram = {
  "address": "6dnVzedfGB2cEFxvEHN9bcAbBPJ5wQQRTRZkgpN9j1bn",
  "metadata": {
  "name": "tokenProgram",
  "version": "0.1.0",
  "spec": "0.1.0",
  "description": "Created with Anchor"
  },
  "instructions": [
  {
  "name": "createToken",
  "discriminator": [
  84,
  52,
  204,
  228,
  24,
  140,
  234,
  75
  ],
  "accounts": [
  {
  "name": "payer",
  "writable": true,
  "signer": true
  },
  {
  "name": "mintAccount",
  "writable": true,
  "signer": true
  },
  {
  "name": "metadataAccount",
  "writable": true,
  "pda": {
  "seeds": [
  {
  "kind": "const",
  "value": [
  109,
  101,
  116,
  97,
  100,
  97,
  116,
  97
  ]
  },
  {
  "kind": "account",
  "path": "tokenMetadataProgram"
  },
  {
  "kind": "account",
  "path": "mintAccount"
  }
  ],
  "program": {
  "kind": "account",
  "path": "tokenMetadataProgram"
  }
  }
  },
  {
  "name": "tokenProgram",
  "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  },
  {
  "name": "tokenMetadataProgram",
  "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  },
  {
  "name": "systemProgram",
  "address": "11111111111111111111111111111111"
  },
  {
  "name": "rent",
  "address": "SysvarRent111111111111111111111111111111111"
  }
  ],
  "args": [
  {
  "name": "tokenTitle",
  "type": "string"
  },
  {
  "name": "tokenSymbol",
  "type": "string"
  },
  {
  "name": "tokenUri",
  "type": "string"
  }
  ]
  },
  {
  "name": "mintToken",
  "discriminator": [
  172,
  137,
  183,
  14,
  207,
  110,
  234,
  56
  ],
  "accounts": [
  {
  "name": "mintAuthority",
  "writable": true,
  "signer": true
  },
  {
  "name": "recipient"
  },
  {
  "name": "mintAccount",
  "writable": true
  },
  {
  "name": "associatedTokenAccount",
  "writable": true,
  "pda": {
  "seeds": [
  {
  "kind": "account",
  "path": "recipient"
  },
  {
  "kind": "const",
  "value": [
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
  ]
  },
  {
  "kind": "account",
  "path": "mintAccount"
  }
  ],
  "program": {
  "kind": "const",
  "value": [
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
  ]
  }
  }
  },
  {
  "name": "tokenProgram",
  "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  },
  {
  "name": "associatedTokenProgram",
  "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
  },
  {
  "name": "systemProgram",
  "address": "11111111111111111111111111111111"
  }
  ],
  "args": [
  {
  "name": "amount",
  "type": "u64"
  }
  ]
  },
  {
  "name": "transferTokens",
  "discriminator": [
  54,
  180,
  238,
  175,
  74,
  85,
  126,
  188
  ],
  "accounts": [
  {
  "name": "sender",
  "writable": true,
  "signer": true
  },
  {
  "name": "recipient",
  "writable": true
  },
  {
  "name": "mintAccount",
  "writable": true
  },
  {
  "name": "senderTokenAccount",
  "writable": true,
  "pda": {
  "seeds": [
  {
  "kind": "account",
  "path": "sender"
  },
  {
  "kind": "const",
  "value": [
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
  ]
  },
  {
  "kind": "account",
  "path": "mintAccount"
  }
  ],
  "program": {
  "kind": "const",
  "value": [
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
  ]
  }
  }
  },
  {
  "name": "recipientTokenAccount",
  "writable": true,
  "pda": {
  "seeds": [
  {
  "kind": "account",
  "path": "recipient"
  },
  {
  "kind": "const",
  "value": [
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
  ]
  },
  {
  "kind": "account",
  "path": "mintAccount"
  }
  ],
  "program": {
  "kind": "const",
  "value": [
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
  ]
  }
  }
  },
  {
  "name": "tokenProgram",
  "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  },
  {
  "name": "associatedTokenProgram",
  "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
  },
  {
  "name": "systemProgram",
  "address": "11111111111111111111111111111111"
  },
  {
  "name": "complianceProgram",
  "address": "EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA"
  },
  {
  "name": "complianceState",
  "writable": true
  }
  ],
  "args": [
  {
  "name": "amount",
  "type": "u64"
  }
  ]
  }
  ]
  };
