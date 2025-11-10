(**
 * Soul-NFT Contract for Proof of Becoming (MVP - Simplified)
 *
 * Simplified FA2-compatible contract without external dependencies
 * Core features: mint (1 per address), evolve, non-transferable
 *)

(* Token metadata structure *)
type token_metadata_value = {
  token_id : nat;
  token_info : (string, bytes) map;
}

(* Storage type *)
type storage = {
  admin : address;
  next_token_id : nat;
  ledger : (address, nat) big_map;  (* owner -> token_id *)
  token_metadata : (nat, token_metadata_value) big_map;
  metadata : (string, bytes) big_map;  (* Contract metadata TZIP-16 *)
}

(* Evolution parameters *)
type evolution_params = {
  token_id : nat;
  stage : nat;
  seed : string;
  metadata_uri : string;
}

(* Balance request/response types (FA2 standard) *)
type balance_request = {
  owner : address;
  token_id : nat;
}

type balance_response = {
  request : balance_request;
  balance : nat;
}

type balance_callback = (balance_response list) contract

type balance_params = {
  requests : balance_request list;
  callback : balance_callback;
}

(* Return type *)
type return = operation list * storage

(* Error messages *)
[@inline]
let error_NOT_ADMIN = "NOT_ADMIN"

[@inline]
let error_ALREADY_MINTED = "ALREADY_MINTED"

[@inline]
let error_TOKEN_UNDEFINED = "TOKEN_UNDEFINED"

[@inline]
let error_NOT_OWNER = "NOT_OWNER"

[@inline]
let error_TRANSFER_DISABLED = "TRANSFER_DISABLED"

(* Helper: Check if address already has a Soul-NFT *)
let has_soul_nft (owner : address) (s : storage) : bool =
  Big_map.mem owner s.ledger

(* Entrypoint: Mint Soul-NFT (one per address) *)
let mint_soul (owner : address) (metadata_uri : string) (s : storage) : return =
  (* Only admin can mint *)
  let () = assert_with_error (Tezos.get_sender () = s.admin) error_NOT_ADMIN in

  (* Check if owner already has a Soul-NFT *)
  let () = assert_with_error (not (has_soul_nft owner s)) error_ALREADY_MINTED in

  let token_id = s.next_token_id in

  (* Create token metadata *)
  let token_meta : token_metadata_value = {
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
let evolve (params : evolution_params) (s : storage) : return =
  (* Check token exists *)
  let token_meta = match Big_map.find_opt params.token_id s.token_metadata with
    | None -> (failwith error_TOKEN_UNDEFINED : token_metadata_value)
    | Some meta -> meta
  in

  (* Check sender owns the token *)
  let _owner = match Big_map.find_opt (Tezos.get_sender ()) s.ledger with
    | None -> (failwith error_NOT_OWNER : address)
    | Some tid ->
      let () = assert_with_error (tid = params.token_id) error_NOT_OWNER in
      Tezos.get_sender ()
  in

  (* Update token metadata with new URI and evolution data *)
  let new_token_info = Map.literal [
    ("", Bytes.pack params.metadata_uri);
    ("stage", Bytes.pack params.stage);
    ("seed", Bytes.pack params.seed);
  ] in

  let updated_meta = { token_meta with token_info = new_token_info } in
  let new_token_metadata = Big_map.update params.token_id (Some updated_meta) s.token_metadata in

  let new_storage = { s with token_metadata = new_token_metadata } in

  ([] : operation list), new_storage

(* FA2 balance_of - required by standard *)
let balance_of (params : balance_params) (s : storage) : return =
  let get_balance (req : balance_request) : balance_response =
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
  | Balance_of of balance_params

let main (param, storage : parameter * storage) : return =
  match param with
  | Mint_soul (owner, uri) -> mint_soul owner uri storage
  | Evolve params -> evolve params storage
  | Balance_of params -> balance_of params storage
