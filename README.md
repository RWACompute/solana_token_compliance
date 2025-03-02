## Solana Modular COmpliance (ERC-4336)

## First Steps

```sh
solana-keygen new --outfile target/deploy/geo_restrict_module-keypair.json
solana-keygen new --outfile target/deploy/kyc_module-keypair.json
solana-keygen new --outfile target/deploy/modular_compliance-keypair.json
```

### Solana Programs IDs

geo_restrict_module: scBwKWSo8RN9VHM629PWSu9kPGDaRzBZgqYQSEoipfe
kyc_module: BXGeVsqLrbTQ7dPAd1a12bA7zuewNKHi3rPpaF7qWov7
modular_compliance: EBrwd8JEmXP2M4YRbhdTP1zuSj4cm9W4MzMNf6eMAUAA

## Interface for compliance modules

```rust
use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

pub trait IModularCompliance {
    fn check_compliance(ctx: Context<CheckCompliance>, user_country: String) -> Result<bool>;
    fn bind_compliance(ctx: Context<BindCompliance>, compliance: Pubkey) -> Result<()>;
    fn unbind_compliance(ctx: Context<UnbindCompliance>) -> Result<()>;
    fn is_bound(ctx: Context<IsBound>) -> Result<bool>;
}

```
