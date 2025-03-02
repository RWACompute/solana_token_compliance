import * as anchor from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { GeoRestrictModule } from "../target/types/geo_restrict_module";
import { ModularCompliance } from "../target/types/modular_compliance";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("Token Program - Create Token & Mint", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const tokenProgram = anchor.workspace
    .TokenProgram as anchor.Program<TokenProgram>;
  const geoRestrictModule = anchor.workspace
    .GeoRestrictModule as anchor.Program<GeoRestrictModule>;
  const modularCompliance = anchor.workspace
    .ModularCompliance as anchor.Program<ModularCompliance>;

  const metadata = {
    name: "Solana Gold",
    symbol: "GOLDSOL",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  };

  const mintKeypair = new Keypair();

  let complianceState: PublicKey;

  it("✅ Cria um token com Metaplex metadata!", async () => {
    const transactionSignature = await tokenProgram.methods
      .createToken(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        payer: payer.publicKey,
        mintAccount: mintKeypair.publicKey,
      })
      .signers([mintKeypair])
      .rpc();

    console.log("✅ Token criado com sucesso!");
    console.log(`   Mint Address: ${mintKeypair.publicKey}`);
    console.log(`   Transaction Signature: ${transactionSignature}`);
  });

  it("✅ Mint tokens!", async () => {
    const amount = new anchor.BN(100);

    const associatedTokenAccount = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      payer.publicKey
    );

    const transactionSignature = await tokenProgram.methods
      .mintToken(amount)
      .accountsStrict({
        mintAuthority: payer.publicKey,
        recipient: payer.publicKey,
        mintAccount: mintKeypair.publicKey,
        associatedTokenAccount: associatedTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: new anchor.web3.PublicKey(
          "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        ),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Mint realizado com sucesso!");
    console.log(`   Conta de Token Associada: ${associatedTokenAccount}`);
    console.log(`   Transaction Signature: ${transactionSignature}`);
  });

  it("✅ Inicializa o estado de compliance", async () => {
    // Gera um novo Keypair para a conta de estado
    const stateKeypair = Keypair.generate();
    complianceState = stateKeypair.publicKey;

    const result = await geoRestrictModule.methods
      .initialize()
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateKeypair])
      .rpc();

    console.log("✅ GeoState criado com sucesso.");
    console.log(`   GeoState Address: ${complianceState}`);
    console.log(`   Transaction Signature: ${result}`);

    // Buscando os dados da conta geo_state
    const geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("Dados da GeoState:", geoStateData);
  });

  it("✅ Init e set compliance", async () => {
    // generate new keypair for the geo_restrict_module program
    const stateKeypair = Keypair.generate();
    complianceState = stateKeypair.publicKey;

    const result = await geoRestrictModule.methods
      .initialize()
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateKeypair])
      .rpc();

    console.log("✅ GeoState criado com sucesso.");
    console.log(`   GeoState Address: ${complianceState}`);
    console.log(`   Transaction Signature: ${result}`);

    // Consulta os dados iniciais
    let geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("initial geoState data", geoStateData);
    // In the point of view of the modular_compliance program, the geo_restrict_module program is not initialized.

    // set new address to the geo_restrict_module program setting the modular compliance address
    const newCompliance = new PublicKey(
      "78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN"
    );

    const bindResult = await geoRestrictModule.methods
      .bindCompliance(newCompliance)
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✅ init and bind compliance");
    console.log(`   Transaction Signature (bind): ${bindResult}`);

    // get new geoState data
    geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("updated geoState data", geoStateData);
  });

  // it("✅ Transferência sem compliance deve funcionar", async () => {
  //   await tokenProgram.methods
  //     .transferTokens(new anchor.BN(10))
  //     .accounts({
  //       sender: payer.publicKey,
  //       recipient: recipientKeypair.publicKey,
  //       mintAccount: mintKeypair.publicKey,
  //       complianceState,
  //     })
  //     .signers([payer.payer])
  //     .rpc();

  //   console.log("✅ Transferência sem compliance passou.");
  // });

  // it("✅ Adiciona o módulo geo_restrict_module no modular_compliance", async () => {
  //   await modularCompliance.methods
  //     .initialize()
  //     .accountsPartial({
  //       complianceState: complianceState,
  //       authority: payer.publicKey,
  //     })
  //     .signers([payer.payer])
  //     .rpc();

  //   console.log("✅ Módulo geo_restrict_module adicionado ao compliance.");
  // });

  // it("✅ Configura geo_restrict_module e adiciona um país restrito", async () => {
  //   await geoRestrictModule.methods
  //     .initialize()
  //     .accounts({
  //       authority: payer.publicKey,
  //     })
  //     .signers([payer.payer])
  //     .rpc();

  //   await geoRestrictModule.methods
  //     .bindCompliance(complianceState)
  //     .accounts({
  //       geoState: geoRestrictModule.programId,
  //       authority: payer.publicKey,
  //     })
  //     .signers([payer.payer])
  //     .rpc();

  //   console.log("✅ geo_restrict_module vinculado ao compliance.");
  // });

  // it("🚫 Bloqueia transferência para um país restrito", async () => {
  //   const userCountry = "North Korea"; // Exemplo de país restrito.

  //   const isCompliant = await geoRestrictModule.methods
  //     .checkCompliance(userCountry)
  //     .accounts({
  //       geoState: geoRestrictModule.programId,
  //     })
  //     .rpc();

  //   expect(isCompliant).to.be.false;

  //   try {
  //     await tokenProgram.methods
  //       .transferTokens(new anchor.BN(10))
  //       .accounts({
  //         sender: payer.publicKey,
  //         recipient: recipientKeypair.publicKey,
  //         mintAccount: mintKeypair.publicKey,
  //         complianceState,
  //       })
  //       .signers([payer.payer])
  //       .rpc();
  //     throw new Error("🚨 Transferência deveria ter sido bloqueada!");
  //   } catch (err) {
  //     console.log(
  //       "✅ Transferência bloqueada corretamente para um país restrito."
  //     );
  //   }
  // });

  // it("✅ Permite transferência para um país permitido", async () => {
  //   const userCountry = "Brazil"; // País permitido.

  //   const isCompliant = await geoRestrictModule.methods
  //     .checkCompliance(userCountry)
  //     .accounts({
  //       geoState: geoRestrictModule.programId,
  //     })
  //     .rpc();

  //   expect(isCompliant).to.be.true;

  //   await tokenProgram.methods
  //     .transferTokens(new anchor.BN(10))
  //     .accounts({
  //       sender: payer.publicKey,
  //       recipient: recipientKeypair.publicKey,
  //       mintAccount: mintKeypair.publicKey,
  //       complianceState,
  //     })
  //     .signers([payer.payer])
  //     .rpc();

  //   console.log(
  //     "✅ Transferência permitida corretamente para um país permitido."
  //   );
  // });
});
