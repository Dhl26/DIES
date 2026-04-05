'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class EvidenceContract extends Contract {
    async InitLedger(ctx) {
        console.log('Evidence Ledger Initialized');
    }

    async registerEvidence(ctx, fileHash, metadata) {
        const existing = await ctx.stub.getState(fileHash);
        if (existing && existing.length > 0) {
            throw new Error(`Evidence with hash ${fileHash} already exists`);
        }

        const timestamp = new Date().getTime().toString();
        const clientIdentity = ctx.clientIdentity.getID();

        // Create root custody node ID
        const rootId = crypto.createHash('sha256').update(fileHash + clientIdentity + timestamp).digest('hex');

        const rootNode = {
            id: rootId,
            parentId: '',
            holder: clientIdentity,
            action: 'INITIAL_UPLOAD',
            timestamp: timestamp,
            metadata: metadata
        };
        await ctx.stub.putState(rootId, Buffer.from(JSON.stringify(rootNode)));

        const evidence = {
            docType: 'evidence',
            fileHash: fileHash,
            uploader: clientIdentity,
            timestamp: timestamp,
            metadata: metadata,
            rootCustodyNodeId: rootId
        };
        await ctx.stub.putState(fileHash, Buffer.from(JSON.stringify(evidence)));

        ctx.stub.setEvent('EvidenceRegistered', Buffer.from(JSON.stringify({ fileHash, uploader: clientIdentity, timestamp })));
        return JSON.stringify(evidence);
    }

    async addCustodyEvent(ctx, parentId, action, metadata) {
        const parentState = await ctx.stub.getState(parentId);
        if (!parentState || parentState.length === 0) {
            throw new Error(`Parent node ${parentId} does not exist`);
        }

        const timestamp = new Date().getTime().toString();
        const clientIdentity = ctx.clientIdentity.getID();

        const nodeId = crypto.createHash('sha256').update(parentId + clientIdentity + action + timestamp).digest('hex');
        
        const newNode = {
            id: nodeId,
            parentId: parentId,
            holder: clientIdentity,
            action: action,
            timestamp: timestamp,
            metadata: metadata
        };

        await ctx.stub.putState(nodeId, Buffer.from(JSON.stringify(newNode)));
        ctx.stub.setEvent('CustodyEventAdded', Buffer.from(JSON.stringify({ nodeId, parentId, action, holder: clientIdentity })));
        return JSON.stringify(newNode);
    }

    async getEvidence(ctx, fileHash) {
        const evidenceBuffer = await ctx.stub.getState(fileHash);
        if (!evidenceBuffer || evidenceBuffer.length === 0) {
            throw new Error(`Evidence with hash ${fileHash} does not exist`);
        }
        return evidenceBuffer.toString();
    }

    async getCustodyNode(ctx, nodeId) {
        const nodeBuffer = await ctx.stub.getState(nodeId);
        if (!nodeBuffer || nodeBuffer.length === 0) {
            throw new Error(`Node with id ${nodeId} does not exist`);
        }
        return nodeBuffer.toString();
    }
}

module.exports = EvidenceContract;
