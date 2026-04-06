const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration for Fabric Gateway connection
const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'evidence-contract';
const mspId = process.env.MSP_ID || 'Org1MSP';

const os = require('os');

// Path to native WSL crypto materials dynamically!
const cryptoPath = process.env.CRYPTO_PATH || path.join(os.homedir(), 'fabric-network', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com');
const tlsCertPath = process.env.TLS_CERT_PATH || path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
const keyDirectoryPath = process.env.KEY_DIR_PATH || path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certPath = process.env.CERT_PATH || path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem');
const peerEndpoint = process.env.PEER_ENDPOINT || 'localhost:7051';
const peerHostAlias = process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com';

class FabricContractWrapper {
    constructor() {
        this.gateway = null;
        this.contract = null;
        this.network = null;
        this.isSimulated = false; // Graceful degradation for local UI testing
    }

    async init() {
        try {
            if (!fs.existsSync(tlsCertPath) || !fs.existsSync(certPath) || !fs.existsSync(keyDirectoryPath)) {
                console.warn(`[DEIS] ⚠️  Fabric certificates not found. Running Blockchain in MOCK/SIMULATED mode.`);
                console.warn(`[DEIS] ⚠️  To use real Fabric, set up the network and update paths in server/.env`);
                this.isSimulated = true;
                return;
            }

            const tlsRootCert = fs.readFileSync(tlsCertPath);
            const client = new grpc.Client(peerEndpoint, grpc.credentials.createSsl(tlsRootCert), {
                'grpc.ssl_target_name_override': peerHostAlias,
            });

            const certificate = fs.readFileSync(certPath);
            const identity = { mspId, credentials: certificate };

            const files = fs.readdirSync(keyDirectoryPath);
            const keyPath = path.resolve(keyDirectoryPath, files[0]);
            const privateKeyPem = fs.readFileSync(keyPath);
            const signer = signers.newPrivateKeySigner(crypto.createPrivateKey(privateKeyPem));

            this.gateway = connect({
                client,
                identity,
                signer,
                evaluateOptions: () => { return { deadline: Date.now() + 5000 }; },
                endorseOptions: () => { return { deadline: Date.now() + 15000 }; },
                submitOptions: () => { return { deadline: Date.now() + 5000 }; },
                commitStatusOptions: () => { return { deadline: Date.now() + 60000 }; },
            });

            this.network = this.gateway.getNetwork(channelName);
            this.contract = this.network.getContract(chaincodeName);
            console.log(`[DEIS] ✅ Connected to Hyperledger Fabric Gateway`);

        } catch (error) {
            console.error(`[DEIS] ❌ Fabric initialization failed:`, error);
            this.isSimulated = true;
        }
    }

    // --- Mimic the ethers.Contract interface used in index.js ---

    async getEvidence(hash) {
        if (this.isSimulated) return { fileHash: hash, uploader: 'mock_uploader', timestamp: { toNumber: () => Date.now() / 1000 }, metadata: 'mock_metadata', rootCustodyNodeId: 'mock_node_id' };
        
        try {
            const resultBytes = await this.contract.evaluateTransaction('getEvidence', hash);
            const result = JSON.parse(new TextDecoder().decode(resultBytes));
            // mapping properties to what ethers used to return
            return {
                fileHash: result.fileHash,
                uploader: result.uploader,
                timestamp: { toNumber: () => parseInt(result.timestamp) },
                metadata: result.metadata,
                rootCustodyNodeId: result.rootCustodyNodeId
            };
        } catch (error) {
            console.warn(`[DEIS] ⚠️ Fabric offline or err: ${error.message}. Switching to simulated mode.`);
            this.isSimulated = true;
            return this.getEvidence(hash);
        }
    }

    async registerEvidence(hash, metadata) {
        if (this.isSimulated) {
            console.log(`[DEIS][MOCK] Registering evidence ${hash} locally`);
            return { wait: async () => {}, hash: crypto.randomBytes(32).toString('hex') };
        }
        try {
            const resultBytes = await this.contract.submitTransaction('registerEvidence', hash, metadata);
            // Simulate an ethers transaction receipt
            return { 
                wait: async () => {}, 
                hash: crypto.randomBytes(32).toString('hex') 
            };
        } catch (error) {
            console.warn(`[DEIS] ⚠️ Fabric offline or err: ${error.message}. Switching to simulated mode.`);
            this.isSimulated = true;
            return this.registerEvidence(hash, metadata);
        }
    }

    async addCustodyEvent(rootNodeId, action, notes) {
        if (this.isSimulated) {
            console.log(`[DEIS][MOCK] Adding custody event ${action} locally`);
            return { wait: async () => {}, hash: crypto.randomBytes(32).toString('hex') };
        }
        try {
            const resultBytes = await this.contract.submitTransaction('addCustodyEvent', rootNodeId, action, notes);
            return { 
                wait: async () => {}, 
                hash: crypto.randomBytes(32).toString('hex') 
            };
        } catch (error) {
            console.warn(`[DEIS] ⚠️ Fabric offline or err: ${error.message}. Switching to simulated mode.`);
            this.isSimulated = true;
            return this.addCustodyEvent(rootNodeId, action, notes);
        }
    }
}

const fabricWrapper = new FabricContractWrapper();
fabricWrapper.init();

module.exports = fabricWrapper;
