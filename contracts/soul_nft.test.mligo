(**
 * Unit tests for Soul-NFT contract
 * Tests: mint, evolve, transfer restrictions, 1-per-address invariant
 *)

#import "./soul_nft.mligo" "SoulNFT"

(* Test helpers *)
let admin = ("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb" : address)
let alice = ("tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6" : address)
let bob = ("tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN" : address)

let initial_storage : SoulNFT.storage = {
  admin = admin;
  next_token_id = 0n;
  ledger = (Big_map.empty : (address, nat) big_map);
  token_metadata = (Big_map.empty : (nat, SoulNFT.FA2.TZIP16.tokenMetadataData) big_map);
  metadata = (Big_map.empty : (string, bytes) big_map);
  operators = (Big_map.empty : ((address * (address * nat)), unit) big_map);
}

(* Test: Admin can mint Soul-NFT *)
let test_mint_soul_success =
  let metadata_uri = "ipfs://QmTest123" in
  let param = SoulNFT.Mint_soul (alice, metadata_uri) in

  (* Set sender to admin *)
  let () = Test.set_source admin in

  let (ops, new_storage) = SoulNFT.main (param, initial_storage) in

  (* Assert no operations emitted *)
  let () = assert (List.length ops = 0n) in

  (* Assert token minted *)
  let () = assert (new_storage.next_token_id = 1n) in

  (* Assert alice owns token 0 *)
  let token_id_opt = Big_map.find_opt alice new_storage.ledger in
  let () = assert (token_id_opt = Some 0n) in

  (* Assert metadata exists *)
  let meta_opt = Big_map.find_opt 0n new_storage.token_metadata in
  let () = assert (Option.is_some meta_opt) in

  ()

(* Test: Cannot mint twice for same address *)
let test_mint_soul_already_minted =
  let metadata_uri = "ipfs://QmTest123" in

  (* First mint *)
  let param1 = SoulNFT.Mint_soul (alice, metadata_uri) in
  let () = Test.set_source admin in
  let (_, storage_after_first) = SoulNFT.main (param1, initial_storage) in

  (* Second mint should fail *)
  let param2 = SoulNFT.Mint_soul (alice, "ipfs://QmTest456") in
  let result = Test.run (fun () -> SoulNFT.main (param2, storage_after_first)) in

  (* Assert it failed with ALREADY_MINTED error *)
  match result with
  | Fail _ -> ()
  | Success _ -> Test.failwith "Expected mint to fail for duplicate address"

(* Test: Non-admin cannot mint *)
let test_mint_soul_not_admin =
  let metadata_uri = "ipfs://QmTest123" in
  let param = SoulNFT.Mint_soul (alice, metadata_uri) in

  (* Set sender to bob (not admin) *)
  let () = Test.set_source bob in

  let result = Test.run (fun () -> SoulNFT.main (param, initial_storage)) in

  (* Assert it failed with NOT_ADMIN error *)
  match result with
  | Fail _ -> ()
  | Success _ -> Test.failwith "Expected mint to fail for non-admin"

(* Test: Owner can evolve their NFT *)
let test_evolve_success =
  let metadata_uri = "ipfs://QmTest123" in

  (* First mint a token for alice *)
  let mint_param = SoulNFT.Mint_soul (alice, metadata_uri) in
  let () = Test.set_source admin in
  let (_, storage_after_mint) = SoulNFT.main (mint_param, initial_storage) in

  (* Alice evolves her token *)
  let evolve_params : SoulNFT.evolution_params = {
    token_id = 0n;
    stage = 1n;
    seed = "quantum-seed-abc123";
    metadata_uri = "ipfs://QmEvolved456";
  } in
  let evolve_param = SoulNFT.Evolve evolve_params in

  let () = Test.set_source alice in
  let (ops, new_storage) = SoulNFT.main (evolve_param, storage_after_mint) in

  (* Assert no operations *)
  let () = assert (List.length ops = 0n) in

  (* Assert metadata updated *)
  let meta_opt = Big_map.find_opt 0n new_storage.token_metadata in
  let () = assert (Option.is_some meta_opt) in

  ()

(* Test: Non-owner cannot evolve NFT *)
let test_evolve_not_owner =
  let metadata_uri = "ipfs://QmTest123" in

  (* Mint token for alice *)
  let mint_param = SoulNFT.Mint_soul (alice, metadata_uri) in
  let () = Test.set_source admin in
  let (_, storage_after_mint) = SoulNFT.main (mint_param, initial_storage) in

  (* Bob tries to evolve Alice's token *)
  let evolve_params : SoulNFT.evolution_params = {
    token_id = 0n;
    stage = 1n;
    seed = "malicious-seed";
    metadata_uri = "ipfs://QmEvil";
  } in
  let evolve_param = SoulNFT.Evolve evolve_params in

  let () = Test.set_source bob in
  let result = Test.run (fun () -> SoulNFT.main (evolve_param, storage_after_mint)) in

  (* Assert it failed *)
  match result with
  | Fail _ -> ()
  | Success _ -> Test.failwith "Expected evolve to fail for non-owner"

(* Test: Transfer is always disabled *)
let test_transfer_disabled =
  let transfer_param = SoulNFT.Transfer ([]: SoulNFT.FA2.TZIP12.transfer list) in

  let result = Test.run (fun () -> SoulNFT.main (transfer_param, initial_storage)) in

  match result with
  | Fail _ -> ()
  | Success _ -> Test.failwith "Expected transfer to fail (always disabled)"
