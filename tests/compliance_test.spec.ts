import * as anchor from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { GeoRestrictModule } from "../target/types/geo_restrict_module";
import { ModularCompliance } from "../target/types/modular_compliance";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("\n=== Token Program - Create Token & Mint ===\n", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

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

  it(">>> Cria um token com Metaplex metadata!", async () => {
    console.log(">>> Iniciando criação do token...");
    const transactionSignature = await tokenProgram.methods
      .createToken(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        payer: payer.publicKey,
        mintAccount: mintKeypair.publicKey,
      })
      .signers([mintKeypair])
      .rpc();

    console.log("✔ Token criado com sucesso!");
    console.log("Mint Address:", mintKeypair.publicKey.toBase58());
    console.log("Transaction Signature:", transactionSignature);
  });

  it(">>> Mint tokens!", async () => {
    console.log(">>> Iniciando processo de Mint...");
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
        associatedTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: new anchor.web3.PublicKey(
          "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        ),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✔ Mint realizado com sucesso!");
    console.log("Conta de Token Associada:", associatedTokenAccount.toBase58());
    console.log("Transaction Signature:", transactionSignature);
  });

  it(">>> Inicializa o estado de compliance", async () => {
    console.log(">>> Inicializando GeoState (compliance)...");
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

    console.log("✔ GeoState criado com sucesso!");
    console.log("GeoState Address:", complianceState.toBase58());
    console.log("Transaction Signature:", result);

    const geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("Dados da GeoState:");
    console.table({
      authority: geoStateData.authority.toBase58(),
      complianceContract: geoStateData.complianceContract.toBase58(),
      isBound: geoStateData.isBound,
      restrictedCountries: geoStateData.restrictedCountries,
    });
  });

  it(">>> Init e set Countries Allowed", async () => {
    console.log(">>> Criando novo GeoState e configurando países...");

    // 1) Cria um novo GeoState
    const stateKeypair = Keypair.generate();
    complianceState = stateKeypair.publicKey;

    const initTxSig = await geoRestrictModule.methods
      .initialize()
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stateKeypair])
      .rpc();

    console.log("✔ Novo GeoState criado.");
    console.log("GeoState Address:", complianceState.toBase58());
    console.log("Transaction Signature:", initTxSig);

    let geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("Dados iniciais da GeoState:");
    console.table({
      authority: geoStateData.authority.toBase58(),
      complianceContract: geoStateData.complianceContract.toBase58(),
      isBound: geoStateData.isBound,
      restrictedCountries: geoStateData.restrictedCountries,
    });

    // 2) Vincula ao modular_compliance (opcional)
    const newCompliance = new PublicKey(
      "78ZVaqUpKoWduqWujw5HqFWi77qsTSLnpq3TMvbtbLyN"
    );
    const bindTxSig = await geoRestrictModule.methods
      .bindCompliance(newCompliance)
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ Módulo georrestrição vinculado ao contrato de compliance.");
    console.log("Transaction Signature (bind):", bindTxSig);

    geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("GeoState após bind:");
    console.table({
      authority: geoStateData.authority.toBase58(),
      complianceContract: geoStateData.complianceContract.toBase58(),
      isBound: geoStateData.isBound,
      restrictedCountries: geoStateData.restrictedCountries,
    });

    // 3) Define os países restritos (ou permitidos) – ajustando a lógica de check_compliance
    const restrictedCountries = ["North Korea", "Syria"];
    console.log("Atualizando lista de países restritos:", restrictedCountries);

    const setTxSig = await geoRestrictModule.methods
      .setRestrictedCountries(restrictedCountries)
      .accountsStrict({
        geoState: complianceState,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ Lista de países atualizada.");
    console.log("Transaction Signature (setRestrictedCountries):", setTxSig);

    // 4) Verifica se os países foram gravados
    geoStateData = await geoRestrictModule.account.geoState.fetch(
      complianceState
    );
    console.log("GeoState atualizado:");
    console.table({
      authority: geoStateData.authority.toBase58(),
      complianceContract: geoStateData.complianceContract.toBase58(),
      isBound: geoStateData.isBound,
      restrictedCountries: geoStateData.restrictedCountries.join(", "),
    });
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
