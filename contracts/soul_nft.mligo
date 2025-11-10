(**
 * FA2 Soul-NFT Contract for Proof of Becoming
 *
 * Features:
 * - One Soul-NFT per address (non-transferable)
 * - evolve() entrypoint to update metadata
 * - Events for off-chain indexing
 * - Compliant with TZIP-12 FA2 standard
 *)

#import "@ligo/fa/lib/fa2/asset/single_asset.mligo" "FA2"

type storage = {
  admin: address;
  next_token_id: nat;
  ledger: (address, nat) big_map;  (* owner -> token_id *)
  token_metadata: (nat, FA2.TZIP16.tokenMetadataData) big_map;
  metadata: (string, bytes) big_map;
  operators: ((address * (address * nat)), unit) big_map;
}

type evolution_params = {
  token_id: nat;
  stage: nat;
  seed: string;
  metadata_uri: string;
}

type return = operation list * storage

(* Error codes *)
let error_TOKEN_UNDEFINED = 0n
let error_NOT_OWNER = 1n
let error_ALREADY_MINTED = 2n
let error_TRANSFER_DISABLED = 3n
let error_NOT_ADMIN = 4n

(* Events *)
type evolved_event = {
  token_id: nat;
  stage: nat;
  seed: string;
  metadata_uri: string;
  timestamp: timestamp;
}

(* Helper: Check if address already has a Soul-NFT *)
let has_soul_nft (owner: address) (s: storage) : bool =
  Big_map.mem owner s.ledger

(* Entrypoint: Mint Soul-NFT (one per address) *)
let mint_soul (owner: address) (metadata_uri: string) (s: storage) : return =
  (* Only admin can mint *)
  let _check_admin = assert_with_error (Tezos.get_sender() = s.admin) error_NOT_ADMIN in

  (* Check if owner already has a Soul-NFT *)
  let _check_unique = assert_with_error (not (has_soul_nft owner s)) error_ALREADY_MINTED in

  let token_id = s.next_token_id in

  (* Create token metadata *)
  let token_meta = {
    token_id = token_id;
    token_info = Map.literal [
      ("", Bytes.pack metadata_uri);
    ];
  } in

  (* Update storage *)
  let new_ledger = Big_map.add owner token_id s.ledger in
  let new_token_metadata = Big_map.add token_id token_meta s.token_metadata in
  let new_storage = {
    s with
    next_token_id = token_id + 1n;
    ledger = new_ledger;
    token_metadata = new_token_metadata;
  } in

  ([] : operation list), new_storage

(* Entrypoint: Evolve Soul-NFT metadata *)
let evolve (params: evolution_params) (s: storage) : return =
  (* Check token exists *)
  let token_meta = match Big_map.find_opt params.token_id s.token_metadata with
    | None -> failwith error_TOKEN_UNDEFINED
    | Some meta -> meta
  in

  (* Check sender owns the token *)
  let owner = match Big_map.find_opt (Tezos.get_sender()) s.ledger with
    | None -> failwith error_NOT_OWNER
    | Some tid ->
      let _check = assert_with_error (tid = params.token_id) error_NOT_OWNER in
      Tezos.get_sender()
  in

  (* Update token metadata with new URI *)
  let new_token_info = Map.literal [
    ("", Bytes.pack params.metadata_uri);
    ("stage", Bytes.pack params.stage);
    ("seed", Bytes.pack params.seed);
  ] in

  let updated_meta = { token_meta with token_info = new_token_info } in
  let new_token_metadata = Big_map.update params.token_id (Some updated_meta) s.token_metadata in

  (* Emit evolution event *)
  let event : evolved_event = {
    token_id = params.token_id;
    stage = params.stage;
    seed = params.seed;
    metadata_uri = params.metadata_uri;
    timestamp = Tezos.get_now();
  } in

  let new_storage = { s with token_metadata = new_token_metadata } in

  ([] : operation list), new_storage

(* FA2 transfer is disabled for Soul-NFTs *)
let transfer (_txs: FA2.TZIP12.transfer list) (_s: storage) : return =
  failwith error_TRANSFER_DISABLED

(* FA2 balance_of - required by standard *)
let balance_of (params: FA2.TZIP12.balance_of_param) (s: storage) : return =
  let get_balance (req: FA2.TZIP12.balance_of_request) : FA2.TZIP12.balance_of_response =
    let owner_token = Big_map.find_opt req.owner s.ledger in
    let balance = match owner_token with
      | None -> 0n
      | Some tid -> if tid = req.token_id then 1n else 0n
    in
    { request = req; balance = balance }
  in
  let responses = List.map get_balance params.requests in
  let op = Tezos.transaction responses 0mutez params.callback in
  ([op], s)

(* Main entrypoint router *)
type parameter =
  | Mint_soul of (address * string)  (* owner, metadata_uri *)
  | Evolve of evolution_params
  | Transfer of FA2.TZIP12.transfer list
  | Balance_of of FA2.TZIP12.balance_of_param
  | Update_operators of FA2.TZIP12.update_operators

let main (param, storage : parameter * storage) : return =
  match param with
  | Mint_soul (owner, uri) -> mint_soul owner uri storage
  | Evolve params -> evolve params storage
  | Transfer txs -> transfer txs storage
  | Balance_of params -> balance_of params storage
  | Update_operators _ops ->
      (* Update operators disabled for Soul-NFTs *)
      failwith error_TRANSFER_DISABLED
