#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup(env: &Env) -> (PapyrusRegistryClient<'_>, Address) {
    let contract_id = env.register_contract(None, PapyrusRegistry);
    let client = PapyrusRegistryClient::new(env, &contract_id);
    let owner = Address::generate(env);
    (client, owner)
}

#[test]
fn register_then_fetch() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);

    let doc_hash = String::from_str(&env, "abc123hash");
    let uri = String::from_str(&env, "ipfs://report1");

    client.register_document(&owner, &doc_hash, &uri);

    let record = client.get_document(&doc_hash);
    assert_eq!(record.owner, owner);
    assert_eq!(record.metadata_uri, uri);
    assert_eq!(record.version, 1);
}

#[test]
fn duplicate_registration_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);

    let doc_hash = String::from_str(&env, "abc123hash");
    let uri = String::from_str(&env, "ipfs://report1");

    client.register_document(&owner, &doc_hash, &uri);
    let result = client.try_register_document(&owner, &doc_hash, &uri);
    assert!(result.is_err());
}

#[test]
fn update_metadata_bumps_version() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);

    let doc_hash = String::from_str(&env, "abc123hash");
    let uri = String::from_str(&env, "ipfs://report1");
    let uri2 = String::from_str(&env, "ipfs://report2");

    client.register_document(&owner, &doc_hash, &uri);
    client.update_metadata(&owner, &doc_hash, &uri2);

    let record = client.get_document(&doc_hash);
    assert_eq!(record.metadata_uri, uri2);
    assert_eq!(record.version, 2);
}

#[test]
fn unregistered_lookup_returns_not_found() {
    let env = Env::default();
    let (client, _owner) = setup(&env);

    let doc_hash = String::from_str(&env, "nonexistent");
    let result = client.try_get_document(&doc_hash);
    assert!(result.is_err());
}
