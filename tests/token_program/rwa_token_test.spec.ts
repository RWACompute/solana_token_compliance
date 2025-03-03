import * as anchor from "@coral-xyz/anchor";
import { TokenProgram } from "../../target/types/token_program";
import { GeoRestrictModule } from "../../target/types/geo_restrict_module";
import { ModularCompliance } from "../../target/types/modular_compliance";
import { Keypair, PublicKey } from "@solana/web3.js";

// Definição do teste

describe("\n=== Token Program + Modular Compliance + GeoRestrictModule ===\n", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  // Programas
  const tokenProgram = anchor.workspace
    .TokenProgram as anchor.Program<TokenProgram>;
  const modularCompliance = anchor.workspace
    .ModularCompliance as anchor.Program<ModularCompliance>;
  const geoRestrictModule = anchor.workspace
    .GeoRestrictModule as anchor.Program<GeoRestrictModule>;

  // IDs e chaves
  let complianceStatePubkey: PublicKey;
  let geoStatePubkey: PublicKey;
  let sender: Keypair;
  let receiver: Keypair;

  it(">>> Inicializa contas para o Token Program", async () => {
    sender = Keypair.generate();
    receiver = Keypair.generate();
    console.log("✔ Sender e Receiver gerados!");
  });

  it(">>> Teste de transferência sem compliance ativo", async () => {
    console.log(">>> Testando transferência sem compliance...");

    const txSig = await tokenProgram.methods
      .transfer(new anchor.BN(1000))
      .accountsStrict({
        sender: sender.publicKey,
        receiver: receiver.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    console.log("✔ Transferência sem compliance bem-sucedida!");
    console.log("Transaction Signature:", txSig);
  });

  it(">>> Teste de transferência com compliance ativo e sem módulos", async () => {
    console.log(">>> Testando transferência com compliance sem módulos...");

    // Vincular o token ao compliance
    const bindTx = await modularCompliance.methods
      .bindToken()
      .accountsStrict({
        complianceState: complianceStatePubkey,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ Token vinculado ao compliance!");
    console.log("Transaction Signature:", bindTx);

    const txSig = await tokenProgram.methods
      .transfer(new anchor.BN(1000))
      .accountsStrict({
        sender: sender.publicKey,
        receiver: receiver.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    console.log("✔ Transferência com compliance (sem módulos) bem-sucedida!");
    console.log("Transaction Signature:", txSig);
  });

  it(">>> Teste de transferência com geo_restrict_module ativo e país permitido", async () => {
    console.log(
      ">>> Testando transferência com geo_restrict_module e país permitido..."
    );

    // Configurar país do sender
    await geoRestrictModule.methods
      .setUserCountry("BR")
      .accountsStrict({
        user: sender.publicKey,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ País do usuário configurado para BR");

    const txSig = await tokenProgram.methods
      .transfer(new anchor.BN(1000))
      .accountsStrict({
        sender: sender.publicKey,
        receiver: receiver.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    console.log("✔ Transferência permitida pelo geo_restrict_module!");
    console.log("Transaction Signature:", txSig);
  });

  it(">>> Teste de transferência com geo_restrict_module e país bloqueado (deve falhar)", async () => {
    console.log(">>> Testando transferência com país bloqueado...");

    await geoRestrictModule.methods
      .setRestrictedCountries(["BR"])
      .accountsStrict({
        geoState: geoStatePubkey,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ País BR adicionado à lista de restritos");

    let failed = false;
    try {
      await tokenProgram.methods
        .transfer(new anchor.BN(1000))
        .accountsStrict({
          sender: sender.publicKey,
          receiver: receiver.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([sender])
        .rpc();
    } catch (error) {
      console.log("🚫 Transferência bloqueada conforme esperado!");
      failed = true;
    }

    if (!failed) {
      throw new Error("🚨 A transferência deveria ter sido bloqueada!");
    }
  });
});
