import * as anchor from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("Token Program - Create Token & Mint", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.TokenProgram as anchor.Program<TokenProgram>;

  const metadata = {
    name: "Solana Gold",
    symbol: "GOLDSOL",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  };

  const mintKeypair = new Keypair();

  const senderTokenAddress = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    payer.publicKey
  );

  it("✅ Cria um token com Metaplex metadata!", async () => {
    const transactionSignature = await program.methods
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

    const transactionSignature = await program.methods
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
});
