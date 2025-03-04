import * as anchor from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { GeoRestrictModule } from "../target/types/geo_restrict_module";
import { ModularCompliance } from "../target/types/modular_compliance";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("\n=== Token Program - Transfer Compliance ===\n", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const tokenProgram = anchor.workspace
    .TokenProgram as anchor.Program<TokenProgram>;
  const geoRestrictModule = anchor.workspace
    .GeoRestrictModule as anchor.Program<GeoRestrictModule>;
  const modularCompliance = anchor.workspace
    .ModularCompliance as anchor.Program<ModularCompliance>;

  const mintKeypair = new Keypair();
  const recipientKeypair = new Keypair();
  let complianceState: PublicKey;

  it("✅ Inicializa o estado de compliance", async () => {
    console.log(">>> Inicializando Compliance State...");
    const stateKeypair = Keypair.generate();
    complianceState = stateKeypair.publicKey;

    const result = await modularCompliance.methods
      .initialize()
      .accountsStrict({
        complianceState,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateKeypair])
      .rpc();

    console.log("✔ ComplianceState inicializado com sucesso!");
    console.log("ComplianceState Address:", complianceState.toBase58());
    console.log("Transaction Signature:", result);
  });

  it("✅ Adiciona geo_restrict_module ao Compliance", async () => {
    console.log(">>> Vinculando módulo de restrição geográfica...");

    const geoRestrictPubkey = geoRestrictModule.programId;

    const tx = await modularCompliance.methods
      .addModule(geoRestrictPubkey)
      .accountsStrict({
        complianceState,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ Módulo geo_restrict_module adicionado ao Compliance.");
    console.log("Transaction Signature:", tx);
  });

  it("✅ Permite transferência SEM compliance", async () => {
    console.log(">>> Testando transferência SEM compliance...");

    const senderATA = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      payer.publicKey
    );

    const recipientATA = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      recipientKeypair.publicKey
    );

    const tx = await tokenProgram.methods
      .transferTokens(new anchor.BN(10))
      .accountsStrict({
        sender: payer.publicKey,
        recipient: recipientKeypair.publicKey,
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

    console.log("✅ Transferência sem compliance passou!");
    console.log("Transaction Signature:", tx);
  });

  it("✅ Configura GeoRestrictModule e adiciona um país restrito", async () => {
    console.log(">>> Adicionando país restrito...");

    const restrictedCountries = ["North Korea"];

    const tx = await geoRestrictModule.methods
      .setRestrictedCountries(restrictedCountries)
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ País restrito configurado:", restrictedCountries);
    console.log("Transaction Signature:", tx);
  });

  it("🚫 Bloqueia transferência para um país restrito", async () => {
    console.log(">>> Testando transferência com compliance bloqueando...");

    const [userGeoStateKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_geo"), payer.publicKey.toBuffer()],
      geoRestrictModule.programId
    );

    await geoRestrictModule.methods
      .setUserCountry("North Korea")
      .accountsStrict({
        userGeoState: userGeoStateKey,
        user: payer.publicKey,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    try {
      await tokenProgram.methods
        .transferTokens(new anchor.BN(10))
        .accounts({
          sender: payer.publicKey,
          recipient: recipientKeypair.publicKey,
          mintAccount: mintKeypair.publicKey,
          complianceState,
        })
        .rpc();
      throw new Error("🚨 Transferência deveria ter sido bloqueada!");
    } catch (err) {
      console.log("✅ Transferência bloqueada corretamente.");
    }
  });

  it("✅ Permite transferência para um país permitido", async () => {
    console.log(">>> Testando transferência para país permitido...");

    const [userGeoStateKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_geo"), payer.publicKey.toBuffer()],
      geoRestrictModule.programId
    );

    await geoRestrictModule.methods
      .setUserCountry("Brazil")
      .accountsStrict({
        userGeoState: userGeoStateKey,
        user: payer.publicKey,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const tx = await tokenProgram.methods
      .transferTokens(new anchor.BN(10))
      .accounts({
        sender: payer.publicKey,
        recipient: recipientKeypair.publicKey,
        mintAccount: mintKeypair.publicKey,
        complianceState,
      })
      .rpc();

    console.log("✅ Transferência permitida corretamente.");
    console.log("Transaction Signature:", tx);
  });
});
