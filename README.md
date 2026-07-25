# Papyrus OS

Volume I: The Operating System for Research Commercialization.

## Problem
Academic white papers and deep-tech research are dense and time-consuming for venture capitalists and investors to parse, leading to a massive gap between laboratory innovation and commercial funding. Furthermore, researchers need a publicly verifiable, immutable way to timestamp their findings and establish prior art before sharing them widely. In emerging tech hubs like the Philippines, bridging the gap between university tech-transfer offices and global capital is critical for fostering local deep-tech ecosystems.

## How It Works
1. A user connects their Freighter wallet and places a research PDF upon the upload plate.
2. The manuscript is parsed locally (using `pdf-parse`), and its cryptographic hash (SHA-256) is calculated.
3. The extracted text is dispatched to Groq's high-speed inference engine, which rapidly draws out a structured investor reading: summarizing the core thesis, estimating Total Addressable Market (TAM), outlining 3-5 distinct startup concepts, and identifying key risks. 
4. The user can review this elegant reading on their dashboard and choose to "Register on Stellar," which prompts their wallet to sign a transaction, committing the document's hash and metadata to a Soroban smart contract as an immutable record of prior art.

## How It Uses Stellar
Papyrus OS utilizes **Soroban smart contracts** (`papyrus_registry`) to establish decentralized intellectual provenance. Rather than just relying on standard payments, it uses the Stellar network as an immutable, low-cost ledger for timestamping cryptographic hashes of research documents. The contract binds a document hash to the researcher's Stellar address, emits `REG` and `UPDATE` events for off-chain indexers, and supports versioned metadata updates, providing a robust on-chain foundation for IP ownership.

## Track
Category 5: AI + Stellar (Ideas 111–135)

## Tech Stack
- Framework: Next.js / React
- Stellar SDK: `@stellar/stellar-sdk` v12.x
- Smart Contracts: Rust / `stellar-scaffold-cli`
- Network: testnet
- AI & Parsing: Groq API, `pdf-parse`

## Setup & Run

To assemble the press and run the atelier locally:

\`\`\`bash
git clone https://github.com/your-username/papyrus-os.git
cd papyrus-os/frontend
pnpm install

# Create your local environment file:
cp .env.example .env.local

# Environment variables needed in .env.local:
#   GROQ_API_KEY=your_groq_api_key
#   NEXT_PUBLIC_REGISTRY_CONTRACT_ID=your_deployed_contract_id

pnpm run dev
\`\`\`

## Network Details
- Network: testnet
- RPC URL: https://soroban-testnet.stellar.org
- Contract IDs: `CBSK47OB7PJJDRWXW5ZDT657QUFU2ZG62U4KA3POWCVB3DTCGXYKLN5R`
- Asset issuers: N/A

## Team
- [Ezra Ysabela G. Gellecania] — @[ezraysabela]

## License
MIT