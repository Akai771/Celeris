const WebSocket = require('ws');

// Enable DEBUG for more detailed logs
const DEBUG = true;

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Track active connections by connection ID
const connections = new Map();

// Track client-connectionId mapping
const clientConnections = new Map();

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
            connections.delete(connectionId);
            clientConnections.delete(ws.clientId);
            
            console.log(`Removed connection ${connectionId}`);
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
    
    // Add to connection tracking
    connections.set(data.connectionId, ws);
    clientConnections.set(ws.clientId, data.connectionId);
    
    console.log(`Registered offer for connection ${data.connectionId}`);
    
    // Broadcast offer to any waiting clients for this ID
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
    
    // Register this client with the connection
    connections.set(connectionId, ws);
    clientConnections.set(ws.clientId, connectionId);
    
    console.log(`Client ${ws.clientId} registered connection ${connectionId}`);
    
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
    
    // Add to connection tracking
    clientConnections.set(ws.clientId, data.connectionId);
    
    // Notify client of successful join
    sendToClient(ws, {
        type: 'joined',
        connectionId: data.connectionId
    });
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