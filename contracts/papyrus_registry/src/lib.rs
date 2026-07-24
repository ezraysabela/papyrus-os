#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String};

/// Error codes returned to the client instead of panicking, so the
/// frontend can branch on them cleanly (e.g. "already registered" vs "not found").
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    AlreadyRegistered = 1,
    NotFound = 2,
    NotOwner = 3,
}

/// On-chain record for a registered document.
#[contracttype]
#[derive(Clone)]
pub struct DocumentRecord {
    pub owner: Address,
    pub metadata_uri: String,
    pub version: u32,
    pub registered_at: u64,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Doc(String), // doc_hash -> DocumentRecord
}

#[contract]
pub struct PapyrusRegistry;

#[contractimpl]
impl PapyrusRegistry {
    /// Registers a new document hash on-chain, associating it with an owner
    /// and off-chain report metadata (e.g. an IPFS URI).
    pub fn register_document(
        env: Env,
        owner: Address,
        doc_hash: String,
        metadata_uri: String,
    ) -> Result<(), RegistryError> {
        owner.require_auth();

        let key = DataKey::Doc(doc_hash.clone());

        if env.storage().persistent().has(&key) {
            return Err(RegistryError::AlreadyRegistered);
        }

        let now = env.ledger().timestamp();
        let record = DocumentRecord {
            owner: owner.clone(),
            metadata_uri: metadata_uri.clone(),
            version: 1,
            registered_at: now,
            updated_at: now,
        };

        env.storage().persistent().set(&key, &record);

        // Emit an event so off-chain indexers / the dashboard can react
        // without polling contract storage.
        env.events().publish(
            (symbol_short!("REG"), doc_hash),
            (owner, metadata_uri, record.version),
        );

        Ok(())
    }

    /// Updates the metadata URI for an already-registered document
    /// (e.g. when a new version of the investor report is generated).
    /// Only the original owner may call this.
    pub fn update_metadata(
        env: Env,
        owner: Address,
        doc_hash: String,
        new_metadata_uri: String,
    ) -> Result<(), RegistryError> {
        owner.require_auth();

        let key = DataKey::Doc(doc_hash.clone());
        let mut record: DocumentRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(RegistryError::NotFound)?;

        if record.owner != owner {
            return Err(RegistryError::NotOwner);
        }

        record.metadata_uri = new_metadata_uri.clone();
        record.version += 1;
        record.updated_at = env.ledger().timestamp();

        env.storage().persistent().set(&key, &record);

        env.events().publish(
            (symbol_short!("UPDATE"), doc_hash),
            (owner, new_metadata_uri, record.version),
        );

        Ok(())
    }

    /// Reads back a document's on-chain record. Returns an error rather
    /// than panicking if the hash was never registered.
    pub fn get_document(env: Env, doc_hash: String) -> Result<DocumentRecord, RegistryError> {
        env.storage()
            .persistent()
            .get(&DataKey::Doc(doc_hash))
            .ok_or(RegistryError::NotFound)
    }

    /// Convenience check used by the frontend before submitting a tx,
    /// to warn the user "this paper is already registered" pre-signature.
    pub fn is_registered(env: Env, doc_hash: String) -> bool {
        env.storage().persistent().has(&DataKey::Doc(doc_hash))
    }
}

mod test;
