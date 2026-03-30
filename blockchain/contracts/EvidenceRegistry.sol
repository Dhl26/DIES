// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EvidenceRegistry {
    struct CustodyNode {
        bytes32 id;
        bytes32 parentId;
        address holder;
        string action;
        uint256 timestamp;
        string metadata; // Additional details about the action
    }

    struct Evidence {
        string fileHash;
        address uploader;
        uint256 timestamp;
        string metadata;
        bytes32 rootCustodyNodeId; // Points to the start of custody chain
    }

    // Mapping from file hash to Evidence
    mapping(string => Evidence) public evidences;
    
    // Mapping from Node ID to CustodyNode
    mapping(bytes32 => CustodyNode) public custodyTree;

    event EvidenceRegistered(string indexed fileHash, address indexed uploader, uint256 timestamp);
    event CustodyEventAdded(bytes32 indexed nodeId, bytes32 indexed parentId, string action, address holder);

    // Register new evidence
    function registerEvidence(string memory _fileHash, string memory _metadata) public {
        require(bytes(evidences[_fileHash].fileHash).length == 0, "Evidence already registered");

        // Create root custody node
        bytes32 rootId = keccak256(abi.encodePacked(_fileHash, msg.sender, block.timestamp));
        
        CustodyNode memory rootNode = CustodyNode({
            id: rootId,
            parentId: bytes32(0),
            holder: msg.sender,
            action: "INITIAL_UPLOAD",
            timestamp: block.timestamp,
            metadata: _metadata
        });

        custodyTree[rootId] = rootNode;

        evidences[_fileHash] = Evidence({
            fileHash: _fileHash,
            uploader: msg.sender,
            timestamp: block.timestamp,
            metadata: _metadata,
            rootCustodyNodeId: rootId
        });

        emit EvidenceRegistered(_fileHash, msg.sender, block.timestamp);
        emit CustodyEventAdded(rootId, bytes32(0), "INITIAL_UPLOAD", msg.sender);
    }

    // Add a custody event (transfer, modification check, etc.)
    function addCustodyEvent(bytes32 _parentId, string memory _action, string memory _metadata) public {
        require(custodyTree[_parentId].id != bytes32(0), "Parent node does not exist");

        bytes32 nodeId = keccak256(abi.encodePacked(_parentId, msg.sender, _action, block.timestamp));
        
        CustodyNode memory newNode = CustodyNode({
            id: nodeId,
            parentId: _parentId,
            holder: msg.sender,
            action: _action,
            timestamp: block.timestamp,
            metadata: _metadata
        });

        custodyTree[nodeId] = newNode;

        emit CustodyEventAdded(nodeId, _parentId, _action, msg.sender);
    }

    // Verification: Get complete custody chain (most recent to root)
    function getCustodyChain(bytes32 _startNodeId) public view returns (CustodyNode[] memory) {
        // First pass: Calculate depth to allocate array
        uint256 depth = 0;
        bytes32 currentId = _startNodeId;
        while (currentId != bytes32(0)) {
            depth++;
            currentId = custodyTree[currentId].parentId;
        }

        CustodyNode[] memory chain = new CustodyNode[](depth);
        
        // Second pass: Populate array
        currentId = _startNodeId;
        for (uint256 i = 0; i < depth; i++) {
            chain[i] = custodyTree[currentId];
            currentId = custodyTree[currentId].parentId;
        }
        
        return chain;
    }

    // Verification: Get Evidence details
    function getEvidence(string memory _fileHash) public view returns (Evidence memory) {
        return evidences[_fileHash];
    }

    // Helper: Get Custody Node
    function getCustodyNode(bytes32 _nodeId) public view returns (CustodyNode memory) {
        return custodyTree[_nodeId];
    }
}
