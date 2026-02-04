const WebSocket = require('ws');

// Enable DEBUG for more detailed logs
const DEBUG = true;

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Track active connections by connection ID -> array of WebSocket clients
// This allows multiple clients (sender + receiver) to be in the same connection
const connections = new Map();

// Track client-connectionId mapping (clientId -> connectionId)
const clientConnections = new Map();

// Track roles (clientId -> 'sender' | 'receiver')
const clientRoles = new Map();

console.log('WebRTC Signaling Server starting...');
console.log('Debug mode:', DEBUG ? 'ENABLED' : 'DISABLED');

wss.on('connection', (ws, req) => {
    // Get client IP for better logging
    const ip = req.socket.remoteAddress;
    
    // Assign a unique ID to the client
    const clientId = generateId();
    ws.clientId = clientId;
    
    console.log(`Client connected - ID: ${clientId}, IP: ${ip}`);
    
    // Send welcome message
    sendToClient(ws, {
        type: 'welcome',
        message: 'Connected to signaling server',
        clientId: clientId
    });

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            // Convert buffer to string if needed
            const strMessage = message instanceof Buffer 
                ? message.toString('utf8') 
                : message;
            
            // Parse the message
            const data = JSON.parse(strMessage);
            
            // Log message details
            if (DEBUG) {
                console.log(`[CLIENT ${ws.clientId}] Received message type: ${data.type}`);
                
                if (data.connectionId) {
                    console.log(`[CLIENT ${ws.clientId}] Connection ID: ${data.connectionId}`);
                }
                
                // Log specific parts of the message based on type
                switch (data.type) {
                    case 'offer':
                        console.log(`[CLIENT ${ws.clientId}] Created offer`);
                        if (DEBUG) console.log(`[DEBUG] SDP type: ${data.offer.type}`);
                        break;
                    case 'answer':
                        console.log(`[CLIENT ${ws.clientId}] Created answer`);
                        if (DEBUG) console.log(`[DEBUG] SDP type: ${data.answer.type}`);
                        break;
                    case 'candidate':
                        console.log(`[CLIENT ${ws.clientId}] ICE candidate`);
                        if (DEBUG && data.candidate) {
                            console.log(`[DEBUG] Candidate: ${data.candidate.candidate ? data.candidate.candidate.substr(0, 50) + '...' : 'null'}`);
                        }
                        break;
                }
            }
            
            // Handle different message types
            switch (data.type) {
                case 'offer':
                    handleOffer(ws, data);
                    break;
                    
                case 'answer':
                    handleAnswer(ws, data);
                    break;
                    
                case 'candidate':
                    handleCandidate(ws, data);
                    break;
                    
                case 'register':
                    handleRegister(ws, data);
                    break;
                    
                case 'join':
                    handleJoin(ws, data);
                    break;
                    
                case 'ping':
                    sendToClient(ws, { type: 'pong' });
                    break;
                    
                default:
                    console.log(`[CLIENT ${ws.clientId}] Unknown message type: ${data.type}`);
            }
        } catch (err) {
            console.error(`[CLIENT ${ws.clientId}] Error handling message:`, err);
            console.error(`[CLIENT ${ws.clientId}] Raw message:`, message.toString().substring(0, 150) + '...');
            
            sendToClient(ws, {
                type: 'error',
                message: 'Invalid message format: ' + err.message
            });
        }
    });

    // Handle disconnections
    ws.on('close', () => {
        console.log(`Client disconnected - ID: ${ws.clientId}`);
        
        // Clean up connections
        if (clientConnections.has(ws.clientId)) {
            const connectionId = clientConnections.get(ws.clientId);
            
            // Remove this client from the connections array
            if (connections.has(connectionId)) {
                const clients = connections.get(connectionId);
                const index = clients.indexOf(ws);
                if (index > -1) {
                    clients.splice(index, 1);
                }
                
                // If no more clients, delete the connection entry
                if (clients.length === 0) {
                    connections.delete(connectionId);
                    console.log(`Connection ${connectionId} removed (no clients remaining)`);
                } else {
                    console.log(`Client removed from connection ${connectionId}, ${clients.length} client(s) remaining`);
                    
                    // Notify remaining clients that a peer disconnected
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            sendToClient(client, {
                                type: 'peer-disconnected',
                                connectionId: connectionId
                            });
                        }
                    });
                }
            }
            
            clientConnections.delete(ws.clientId);
            clientRoles.delete(ws.clientId);
        }
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`[CLIENT ${ws.clientId}] WebSocket error:`, error);
    });
});

// Generate a random connection ID
function generateId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

// Get client info for logging
function getClientInfo(ws) {
    return ws.clientId ? `ID: ${ws.clientId}` : 'Unknown';
}

// Handle offer messages
function handleOffer(ws, data) {
    if (!data.connectionId) {
        sendToClient(ws, {
            type: 'error',
            message: 'Missing connectionId'
        });
        return;
    }
    
    // Ensure this client is tracked for this connection
    if (!clientConnections.has(ws.clientId)) {
        clientConnections.set(ws.clientId, data.connectionId);
        
        if (!connections.has(data.connectionId)) {
            connections.set(data.connectionId, []);
        }
        const clients = connections.get(data.connectionId);
        if (!clients.includes(ws)) {
            clients.push(ws);
        }
    }
    
    const clientCount = connections.get(data.connectionId)?.length || 0;
    console.log(`Received offer for connection ${data.connectionId} (${clientCount} clients in connection)`);
    
    // Broadcast offer to all other clients (receivers) in this connection
    broadcastToConnectionId(data.connectionId, {
        type: 'offer',
        offer: data.offer,
        connectionId: data.connectionId
    }, ws);
}

// Handle answer messages
function handleAnswer(ws, data) {
    if (!data.connectionId) {
        sendToClient(ws, {
            type: 'error',
            message: 'Missing connectionId'
        });
        return;
    }
    
    console.log(`Received answer for connection ${data.connectionId}`);
    
    // Send answer to the client that initiated the offer
    broadcastToConnectionId(data.connectionId, {
        type: 'answer',
        answer: data.answer,
        connectionId: data.connectionId
    }, ws);
}

// Handle ICE candidate messages
function handleCandidate(ws, data) {
    if (!data.connectionId) {
        sendToClient(ws, {
            type: 'error',
            message: 'Missing connectionId'
        });
        return;
    }
    
    // Forward candidate to the other peer
    broadcastToConnectionId(data.connectionId, {
        type: 'candidate',
        candidate: data.candidate,
        connectionId: data.connectionId
    }, ws);
}

// Handle register messages (creating a new connection)
function handleRegister(ws, data) {
    const connectionId = data.connectionId || generateId();
    
    // Initialize or get existing clients array for this connection
    if (!connections.has(connectionId)) {
        connections.set(connectionId, []);
    }
    
    // Add this client to the connection (as sender)
    const clients = connections.get(connectionId);
    if (!clients.includes(ws)) {
        clients.push(ws);
    }
    
    // Track the mapping and role
    clientConnections.set(ws.clientId, connectionId);
    clientRoles.set(ws.clientId, 'sender');
    
    console.log(`Client ${ws.clientId} registered as SENDER for connection ${connectionId}`);
    console.log(`Connection ${connectionId} now has ${clients.length} client(s)`);
    
    // Send confirmation to client
    sendToClient(ws, {
        type: 'registered',
        connectionId: connectionId
    });
}

// Handle join messages (joining an existing connection)
function handleJoin(ws, data) {
    if (!data.connectionId) {
        sendToClient(ws, {
            type: 'error',
            message: 'Missing connectionId'
        });
        return;
    }
    
    console.log(`Client ${ws.clientId} joining connection ${data.connectionId}`);
    
    // Initialize connections array if it doesn't exist
    if (!connections.has(data.connectionId)) {
        connections.set(data.connectionId, []);
    }
    
    // Add this client to the connection (as receiver)
    const clients = connections.get(data.connectionId);
    if (!clients.includes(ws)) {
        clients.push(ws);
    }
    
    // Track the mapping and role
    clientConnections.set(ws.clientId, data.connectionId);
    clientRoles.set(ws.clientId, 'receiver');
    
    console.log(`Client ${ws.clientId} joined as RECEIVER for connection ${data.connectionId}`);
    console.log(`Connection ${data.connectionId} now has ${clients.length} client(s)`);
    
    // Notify client of successful join
    sendToClient(ws, {
        type: 'joined',
        connectionId: data.connectionId
    });
    
    // Notify sender that a receiver has joined (so sender can resend offer if needed)
    broadcastToConnectionId(data.connectionId, {
        type: 'peer-joined',
        connectionId: data.connectionId
    }, ws);
}

// Send message to a specific client
function sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// Broadcast message to all clients except sender
function broadcastToAll(message, exclude) {
    wss.clients.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Broadcast to clients with specific connection ID (except sender)
function broadcastToConnectionId(connectionId, message, exclude) {
    // Find all clients with this connection ID
    wss.clients.forEach((client) => {
        if (client !== exclude && 
            client.readyState === WebSocket.OPEN &&
            clientConnections.get(client.clientId) === connectionId) {
            client.send(JSON.stringify(message));
        }
    });
}

// Log any server errors
wss.on('error', (error) => {
    console.error('Server error:', error);
});

console.log('Signaling server running on ws://localhost:8080');

// Print some helpful information
console.log('Server state:');
console.log('- Press Ctrl+C to stop the server');
console.log('- Active connections will be displayed in the logs');