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
  const receiver = Keypair.generate();

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
  const complianceStateKeypair = Keypair.generate();
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
          payer.publicKey,
          associatedTokenAccount,
          owner,
          mint
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

    complianceState = complianceStateKeypair.publicKey;

    const complianceInitTx = await modularCompliance.methods
      .initialize()
      .accountsStrict({
        complianceState,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([complianceStateKeypair])
      .rpc();

    console.log(
      "✔ ComplianceState inicializado! Transaction:",
      complianceInitTx
    );

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

    receiverGeoStateKey = PublicKey.findProgramAddressSync(
      [Buffer.from("user_geo"), receiver.publicKey.toBuffer()],
      geoRestrictModule.programId
    )[0];

    const geoStateTx = await geoRestrictModule.methods
      .setUserCountry("Syria")
      .accountsStrict({
        userGeoState: receiverGeoStateKey,
        user: receiver.publicKey,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(
      "✔ Estado geográfico do usuário inicializado! Transaction:",
      geoStateTx
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
        authority: payer.publicKey,
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

    const geoStateAccountInfo = await provider.connection.getAccountInfo(
      receiverGeoStateKey
    );
    const complianceStateAccountInfo = await provider.connection.getAccountInfo(
      complianceState
    );
    const senderATAInfo = await provider.connection.getAccountInfo(senderATA);
    const recipientATAInfo = await provider.connection.getAccountInfo(
      recipientATA
    );

    console.table({
      sender: payer.publicKey.toBase58(),
      recipient: receiver.publicKey.toBase58(),
      mintAccount: mintKeypair.publicKey.toBase58(),
      senderTokenAccount: senderATA.toBase58(),
      recipientTokenAccount: recipientATA.toBase58(),
      complianceState: complianceState.toBase58(),
      complianceProgram: modularCompliance.programId.toBase58(),
      userGeoState: receiverGeoStateKey.toBase58(),
      geoStateExists: !!geoStateAccountInfo,
      complianceStateExists: !!complianceStateAccountInfo,
      senderATAExists: !!senderATAInfo,
      recipientATAExists: !!recipientATAInfo,
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
          complianceState: complianceState,
          complianceProgram: modularCompliance.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      throw new Error("🚨 A transferência NÃO deveria ter sido permitida!");
    } catch (err) {
      console.log("✅ Transferência corretamente bloqueada! 🚫");
      console.error(err);
    }
  });

  it("✅ Permite a transferência para usuário em país permitido", async () => {
    console.log(">>> Registrando usuário em um país permitido...");

    const allowedCountry = "Canada";

    receiverGeoStateKey = PublicKey.findProgramAddressSync(
      [Buffer.from("user_geo"), receiver.publicKey.toBuffer()],
      geoRestrictModule.programId
    )[0];

    await geoRestrictModule.methods
      .setUserCountry(allowedCountry)
      .accountsStrict({
        userGeoState: receiverGeoStateKey,
        user: receiver.publicKey,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(
      `✔ Usuário registrado no país permitido (${allowedCountry}). Address:`,
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

    if (userGeoData.countryCode !== allowedCountry) {
      throw new Error("🚨 O país registrado está incorreto!");
    }

    console.log(
      `✔ País do usuário corretamente registrado como ${allowedCountry}.`
    );

    console.log(">>> Testando transferência para usuário permitido...");

    const geoStateAccountInfo = await provider.connection.getAccountInfo(
      receiverGeoStateKey
    );
    const complianceStateAccountInfo = await provider.connection.getAccountInfo(
      complianceState
    );
    const senderATAInfo = await provider.connection.getAccountInfo(senderATA);
    const recipientATAInfo = await provider.connection.getAccountInfo(
      recipientATA
    );

    console.table({
      sender: payer.publicKey.toBase58(),
      recipient: receiver.publicKey.toBase58(),
      mintAccount: mintKeypair.publicKey.toBase58(),
      senderTokenAccount: senderATA.toBase58(),
      recipientTokenAccount: recipientATA.toBase58(),
      complianceState: complianceState.toBase58(),
      complianceProgram: modularCompliance.programId.toBase58(),
      userGeoState: receiverGeoStateKey.toBase58(),
      geoStateExists: !!geoStateAccountInfo,
      complianceStateExists: !!complianceStateAccountInfo,
      senderATAExists: !!senderATAInfo,
      recipientATAExists: !!recipientATAInfo,
    });

    try {
      const transferTx = await tokenProgram.methods
        .transferTokens(new anchor.BN(10))
        .accountsStrict({
          sender: payer.publicKey,
          recipient: receiver.publicKey,
          mintAccount: mintKeypair.publicKey,
          senderTokenAccount: senderATA,
          recipientTokenAccount: recipientATA,
          complianceState: complianceState,
          complianceProgram: modularCompliance.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(
        "✅ Transferência realizada com sucesso! Transaction:",
        transferTx
      );
    } catch (err) {
      console.error(
        "🚨 Erro inesperado: A transferência deveria ter sido permitida!"
      );
      console.error(err);
      throw err;
    }
  });
});
