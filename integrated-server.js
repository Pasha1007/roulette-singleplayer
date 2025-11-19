const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();

// Parse JSON bodies
app.use(express.json());

// ConvAI token endpoint - secure API key on backend
app.get('/api/convai/token', (req, res) => {
    const apiKey = process.env.CONVAI_API_KEY;
    
    if (!apiKey) {
        console.error('ERROR: CONVAI_API_KEY environment variable is not set');
        return res.status(500).json({ error: 'ConvAI API key not configured' });
    }
    
    console.log('ConvAI API key fetched successfully (first 10 chars):', apiKey.substring(0, 10) + '...');
    res.json({ apiKey });
});

// ConvAI proxy endpoint - handle API calls from backend to avoid CORS and provide better logging
app.post('/api/convai/chat', express.urlencoded({ extended: true }), async (req, res) => {
    const apiKey = process.env.CONVAI_API_KEY;
    
    if (!apiKey) {
        console.error('ERROR: CONVAI_API_KEY not set');
        return res.status(500).json({ error: 'API key not configured' });
    }
    
    const { userText, charID, sessionID } = req.body;
    
    console.log('ConvAI proxy request:', { 
        userText: userText?.substring(0, 50) + '...', 
        charID,
        sessionID,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        const params = new URLSearchParams({
            userText: userText || '',
            charID: charID || '98d5d4b6-8cfa-11f0-916c-42010a7be01f',
            sessionID: sessionID || '-1',
            voiceResponse: 'True',
            faceResponse: 'False'
        });
        
        const response = await fetch('https://api.convai.com/character/getResponse', {
            method: 'POST',
            headers: {
                'CONVAI-API-KEY': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
        
        console.log('ConvAI API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('ConvAI API error:', errorText);
            return res.status(response.status).json({ 
                error: 'ConvAI API error', 
                details: errorText,
                status: response.status 
            });
        }
        
        const data = await response.json();
        console.log('ConvAI API success! Response text length:', data.text?.length || 0);
        res.json(data);
        
    } catch (error) {
        console.error('ConvAI proxy error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Serve static files from dist directory with no-cache headers
app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, path) => {
        // Disable caching for all files to prevent old code issues
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server on the same HTTP server
const wss = new WebSocket.Server({ server });

console.log('Integrated HTTP and WebSocket server starting...');

// Store player balances per connection
const playerBalances = new Map();

// Store spin count per connection
const playerSpinCounts = new Map();

// Store total bet amount per connection
const playerBetAmounts = new Map();

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Initialize player data
    playerSpinCounts.set(ws, 0);
    playerBalances.set(ws, 10000); // Starting balance: $100.00 (10000 cents)
    playerBetAmounts.set(ws, 0);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            
            if (data.cmdid === 'flblogin') {
                // Send login success response
                ws.send(JSON.stringify({
                    msgid: 'cmdret',
                    cmdid: 'flblogin',
                    isok: true,
                    servtime: Date.now()
                }));
            }
            
            if (data.cmdid === 'comeingame3') {
                // Send user info first
                ws.send(JSON.stringify({
                    msgid: 'gameuserinfo',
                    ctrlid: '12345'
                }));
                
                // Send user base info (balance)
                const balance = playerBalances.get(ws) || 10000;
                ws.send(JSON.stringify({
                    msgid: 'userbaseinfo',
                    userbaseinfo: {
                        gold: balance,
                        currency: 'USD'
                    }
                }));
                
                // Send game config with chip denominations (like old roulette server)
                //New**************, Data structure modification
                ws.send(JSON.stringify({
                    msgid: 'gamecfg',
                    linebets: [
                        { value: 10, color: 'white' },      // 10 cents
                        { value: 25, color: 'red' },        // 25 cents
                        { value: 50, color: 'blue' },       // 50 cents
                        { value: 100, color: 'green' },     // $1
                        { value: 500, color: 'purple' }     // $5
                    ]
                }));
                
                // Send game module info
                ws.send(JSON.stringify({
                    msgid: 'gamemoduleinfo',
                    gameid: 'roulette',
                    gmi: {
                        replyPlay: {
                            results: []
                        }
                    }
                }));
                
                // Send final success
                ws.send(JSON.stringify({
                    msgid: 'cmdret',
                    cmdid: 'comeingame3',
                    isok: true
                }));
            }
            
            // Handle bet placement/update
            if (data.cmdid === 'updatebet' || data.bet) {
                const bets = data.bet || [];
                let totalBetAmount = 0;
                
                // Calculate total bet amount
                if (Array.isArray(bets)) {
                    totalBetAmount = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
                }
                
                // Store bet amount for this player
                playerBetAmounts.set(ws, totalBetAmount);
                
                // Send bet update confirmation with updated balance
                const currentBalance = playerBalances.get(ws) || 10000;
                ws.send(JSON.stringify({
                    msgid: 'updatebet',
                    totalBet: totalBetAmount,
                    balance: currentBalance,
                    bets: bets
                }));
            }
            
            if (data.cmdid === 'gamectrl3') {
                console.log('=== SPIN RECEIVED ===');
                console.log('Ctrl param:', data.ctrlparam);
                
                // Parse bets and calculate total bet
                let bets = [];
                let totalBetAmount = 0;
                try {
                    const commandParam = typeof data.ctrlparam.commandParam === 'string' 
                        ? JSON.parse(data.ctrlparam.commandParam) 
                        : data.ctrlparam.commandParam;
                    bets = commandParam.bets || commandParam || [];
                    totalBetAmount = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
                } catch (e) {
                    console.error('Failed to parse bets:', e);
                }
                
                // Deduct bet amount from balance
                let currentBalance = playerBalances.get(ws) || 10000;
                currentBalance -= totalBetAmount;
                playerBalances.set(ws, currentBalance);
                
                console.log(`Balance before spin: ${currentBalance + totalBetAmount}, bet: ${totalBetAmount}, new balance: ${currentBalance}`);
                
                // Handle spin request
                const spinResult = generateSpinResult(data.ctrlparam, ws);
                console.log('Spin result:', spinResult);
                
                // Update balance with winnings
                if (spinResult.totalWin > 0) {
                    currentBalance += spinResult.totalWin;
                    playerBalances.set(ws, currentBalance);
                    console.log(`Player won ${spinResult.totalWin}, new balance: ${currentBalance}`);
                }
                
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        msgid: 'gamemoduleinfo',
                        gameid: 'roulette',
                        betresult: spinResult.winningNumber,
                        wincoin: spinResult.totalWin,
                        balance: currentBalance,  // Send updated balance
                        gmi: {
                            totalwin: spinResult.totalWin,
                            replyPlay: {
                                results: [{
                                    clientData: {
                                        curGameModParam: {
                                            winningNumber: spinResult.winningNumber
                                        }
                                    },
                                    winningNumber: spinResult.winningNumber,
                                    totalWin: spinResult.totalWin,
                                    wins: spinResult.wins,
                                    finished: spinResult.finished
                                }]
                            }
                        }
                    }));
                }, 1000);
            }
            
            if (data.cmdid === 'refresh') {
                // Send updated balance
                ws.send(JSON.stringify({
                    msgid: 'userbaseinfo',
                    userbaseinfo: {
                        gold: 10000,
                        currency: 'USD'
                    }
                }));
                
                ws.send(JSON.stringify({
                    msgid: 'cmdret',
                    cmdid: 'refresh',
                    isok: true
                }));
            }
            
            if (data.cmdid === 'collect') {
                //New**************, The collected message is the server settlement confirmation message, which must include the player's current balance after settlement
                ws.send(JSON.stringify({
                    msgid: 'collectinfo',
                    playIndex: data.playIndex || 0,
                    totalwin: 100, // Example win amount
                    gold: 10100 // Example updated balance
                }));
                
                ws.send(JSON.stringify({
                    msgid: 'cmdret',
                    cmdid: 'collect',
                    isok: true
                }));
            }
            
            if (data.cmdid === 'keepalive') {
                ws.send(JSON.stringify({
                    msgid: 'timesync',
                    servtime: Date.now()
                }));
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        // Clean up spin count tracking
        playerSpinCounts.delete(ws);
    });
    
    // Send periodic heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                msgid: 'timesync',
                servtime: Date.now()
            }));
        } else {
            clearInterval(heartbeat);
        }
    }, 30000);
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    // Keep connection alive with ping/pong
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

function generateSpinResult(ctrlparam, ws) {
    // Parse the bet data
    let bets = [];
    try {
        const commandParam = typeof ctrlparam.commandParam === 'string' 
            ? JSON.parse(ctrlparam.commandParam) 
            : ctrlparam.commandParam;
        bets = commandParam.bets || commandParam || [];
    } catch (e) {
        console.error('Failed to parse bets:', e);
        bets = [];
    }
    
    // Get current spin count for this player
    const spinCount = playerSpinCounts.get(ws) || 0;
    
    // Generate random number from 0-36 (all roulette numbers)
    const winningNumber = Math.floor(Math.random() * 37);
    
    console.log(`Spin #${spinCount + 1}: Winning number = ${winningNumber}`);
    
    // Increment spin count for next time
    playerSpinCounts.set(ws, spinCount + 1);
    
    // Ensure bets is an array
    if (!Array.isArray(bets)) {
        console.log('Bets is not an array, making empty array');
        bets = [];
    }

    // Calculate wins for each bet
    let totalWin = 0;
    const wins = bets.map(bet => {
        const isWin = checkWin(bet.numbers, winningNumber);
        const winAmount = isWin ? calculatePayout(bet.numbers, bet.amount) : 0;
        totalWin += winAmount;
        
        return {
            bet: bet,
            win: isWin,
            winAmount: winAmount
        };
    });
    
    return {
        winningNumber: winningNumber,
        totalWin: totalWin,
        wins: wins,
        finished: true
    };
}

function checkWin(numbers, winningNumber) {
    return numbers.includes(winningNumber);
}

function calculatePayout(numbers, betAmount) {
    // Real casino payout calculation - includes original bet returned
    let winMultiplier = 0;
    
    if (numbers.length === 1) {
        // Straight up bet - 35:1 + original bet = 36x total
        winMultiplier = 35;
    } else if (numbers.length === 2) {
        // Split bet - 17:1 + original bet = 18x total
        winMultiplier = 17;
    } else if (numbers.length === 3) {
        // Street bet - 11:1 + original bet = 12x total
        winMultiplier = 11;
    } else if (numbers.length === 4) {
        // Corner bet - 8:1 + original bet = 9x total
        winMultiplier = 8;
    } else if (numbers.length === 6) {
        // Line bet - 5:1 + original bet = 6x total
        winMultiplier = 5;
    } else if (numbers.length === 12) {
        // Dozen/Column bet - 2:1 + original bet = 3x total
        winMultiplier = 2;
    } else if (numbers.length === 18) {
        // Even money bet (red/black, odd/even, etc) - 1:1 + original bet = 2x total
        winMultiplier = 1;
    } else {
        // Default payout
        winMultiplier = 2;
    }
    
    // Return winnings PLUS original bet (real casino behavior)
    return (betAmount * winMultiplier) + betAmount;
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Integrated server running on port ${PORT}`);
    console.log(`HTTP server: http://localhost:${PORT}`);
    console.log(`WebSocket server: ws://localhost:${PORT}`);
});