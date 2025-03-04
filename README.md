## Solana Modular COmpliance (ERC-4336)

## First Steps

```sh
solana-keygen new --outfile target/deploy/geo_restrict_module-keypair.json
solana-keygen new --outfile target/deploy/kyc_module-keypair.json
solana-keygen new --outfile target/deploy/modular_compliance-keypair.json
solana-keygen new --outfile target/deploy/token_program-keypair.json
```

## obter os ids

```sh
solana address -k target/deploy/geo_restrict_module-keypair.json
solana address -k target/deploy/kyc_module-keypair.json
solana address -k target/deploy/modular_compliance-keypair.json
solana address -k target/deploy/token_program-keypair.json
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

### Tests

1. DUMP metaplex token metadata program

```sh
solana program dump -u m metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s tests/metaplex_token_metadata_program.so
```

2. Configure Anchor.toml

```toml
[[test.genesis]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
program = "tests/metaplex_token_metadata_program.so"
```

3. Init Local Validator

```sh
solana-test-validator -r --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s tests/metaplex_token_metadata_program.so
```

4. Set To local

```sh
solana config set --url localhost
```

5. Verify

```sh
solana ping
solana logs
```

6. Check if Metadata Program is deployed in localnet

```sh
solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
```

##@ IF show sucess
returns:

```shell
Program Id: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT
Authority: 11111111111111111111111111111111
Last Deployed In Slot: 0
Data Length: 793904 (0xc1d30) bytes
Balance: 5.52677592 SOL
```

### Now Deploy the Modular Compliance Programs

```sh
anchor deploy
```

```sh
4. Run Tests
```
