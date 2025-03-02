// Cargo.toml

[package]
name = "token"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "token"

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-lang = "0.30.1"
anchor-spl = { version = "0.30.0", features = ["metadata"] }

// lib.rs

use anchor_lang::prelude::\*;

declare_id!("scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe");

#[program]
pub mod geo_restrict_module {
use super::\*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize {}

// lib.rs

use anchor_lang::prelude::\*;

declare_id!("BXGeVsqLrbTQ7dPAd1a12bA7zuewNKHi3rPpaF7qWov7");

#[program]
pub mod kyc_module {
use super::\*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize {}

// lib.rs

use anchor_lang::prelude::\*;

declare_id!("EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA");

#[program]
pub mod modular_compliance {
use super::\*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize {}

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

// Cargo.toml

[package]
name = "kyc_module"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "kyc_module"

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build"]

[dependencies]
anchor-lang = "0.30.1"

// Cargo.toml

[package]
name = "modular_compliance"
version = "0.1.0"
description = "Created with Anchor"
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

// Anchor.toml

[toolchain]

[workspace]
members = [
"programs/geo_restrict_module",
"programs/kyc_module",
"programs/modular_compliance",
]

[features]
resolution = true
skip-lint = false

[programs.localnet]
modular_compliance = "EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA"
kyc_module = "BXGeVsqLrbTQ7dPAd1a12bA7zuewNKHi3rPpaF7qWov7"
geo_restrict_module = "scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "./wallets/phantom-keypair.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/\*_/_.ts"
