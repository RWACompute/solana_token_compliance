import * as anchor from "@coral-xyz/anchor";
import { GeoRestrictModule } from "../../target/types/geo_restrict_module";
import { ModularCompliance } from "../../target/types/modular_compliance";
import { Keypair, PublicKey } from "@solana/web3.js";

describe("\n=== Modular Compliance + GeoRestrictModule Integration ===\n", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  // Programa principal de compliance
  const modularCompliance = anchor.workspace
    .ModularCompliance as anchor.Program<ModularCompliance>;

  // Programa de georrestrição
  const geoRestrictModule = anchor.workspace
    .GeoRestrictModule as anchor.Program<GeoRestrictModule>;

  // ID do geoRestrictModule (pode ser o programId do anchor toml)
  const geoRestrictModuleProgramId = geoRestrictModule.programId;

  let complianceStatePubkey: PublicKey;
  let complianceStateKeypair: Keypair;

  // Para guardar a conta do geo_state do módulo georrestrição
  let geoStatePubkey: PublicKey;
  let geoStateKeypair: Keypair;

  it(">>> Inicializa o complianceState no modular_compliance", async () => {
    console.log(">>> Inicializando ComplianceState...");

    // 1) Cria a conta de complianceState
    complianceStateKeypair = Keypair.generate();
    complianceStatePubkey = complianceStateKeypair.publicKey;

    const txSig = await modularCompliance.methods
      .initialize()
      .accountsStrict({
        complianceState: complianceStatePubkey,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([complianceStateKeypair])
      .rpc();

    console.log("✔ ComplianceState criado com sucesso!");
    console.log("ComplianceState Address:", complianceStatePubkey.toBase58());
    console.log("Transaction Signature:", txSig);
  });

  it(">>> Adiciona o módulo geo_restrict_module no complianceState (modular_compliance)", async () => {
    console.log(">>> Chamando addModule para adicionar geo_restrict_module.");

    const txSig = await modularCompliance.methods
      .addModule(geoRestrictModuleProgramId)
      .accountsStrict({
        complianceState: complianceStatePubkey,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ Módulo adicionado com sucesso!");
    console.log("Transaction Signature (addModule):", txSig);

    // (Opcional) Verifica no complianceState se o geoRestrictModule está na lista
    const csData = await modularCompliance.account.complianceState.fetch(
      complianceStatePubkey
    );
    const included = csData.modules.some((m: PublicKey) =>
      m.equals(geoRestrictModuleProgramId)
    );
    if (!included) {
      throw new Error(
        "🚨 Falha ao adicionar o geo_restrict_module no complianceState!"
      );
    }
    console.log("✅ geo_restrict_module presente em complianceState.modules!");
  });

  it(">>> Cria geo_state no geo_restrict_module e faz bind_compliance", async () => {
    console.log(">>> Inicializando geo_state e vinculando ao complianceState.");

    // 1) Cria a conta geo_state
    geoStateKeypair = Keypair.generate();
    geoStatePubkey = geoStateKeypair.publicKey;

    // Chamamos a instrução `initialize` do geo_restrict_module
    const initTx = await geoRestrictModule.methods
      .initialize()
      .accountsStrict({
        geoState: geoStatePubkey,
        authority: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([geoStateKeypair])
      .rpc();

    console.log("✔ geo_state criado com sucesso!");
    console.log("GeoState Address:", geoStatePubkey.toBase58());
    console.log("Transaction Signature (geo init):", initTx);

    // 2) Chamamos bind_compliance para informar ao módulo georrestrição
    //    que o complianceState é seu “contrato principal”.
    const bindTx = await geoRestrictModule.methods
      .bindCompliance(complianceStatePubkey)
      .accountsStrict({
        geoState: geoStatePubkey,
        authority: payer.publicKey,
      })
      .rpc();

    console.log("✔ Módulo georrestrição bound ao complianceState!");
    console.log("Transaction Signature (bind):", bindTx);

    // 3) Verifica se o geoState agora está bound
    const geoStateData = await geoRestrictModule.account.geoState.fetch(
      geoStatePubkey
    );
    if (!geoStateData.isBound) {
      throw new Error("🚨 geo_state não está bound!");
    }
    if (!geoStateData.complianceContract.equals(complianceStatePubkey)) {
      throw new Error(
        "🚨 geo_state.compliance_contract não é o complianceState esperado!"
      );
    }

    console.log("✅ geo_state isBound=true e compliance_contract correto!");
  });
});
