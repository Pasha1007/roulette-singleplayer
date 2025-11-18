/**
 * Full-Featured Roulette Server - Node.js Implementation
 * Matches Go roulette server features with video system instead of wheel
 * 
 * Features:
 * - Session management with unique player IDs
 * - Bet validation and tracking
 * - RNG (Random Number Generation) for fair roulette spins
 * - Win calculation with proper roulette payouts
 * - Game history and statistics
 * - Balance management
 * - Multiple chip denominations
 * - WebSocket real-time communication
 * - HTTP server for game client
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 5000;
const INITIAL_BALANCE = 10000; // $100.00 in cents

// Roulette constants
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Chip denominations (in cents)
const CHIP_DENOMINATIONS = [10, 25, 50, 100, 500]; // 10¢, 25¢, 50¢, $1, $5

/**
 * Player Session - Tracks player state
 */
class PlayerSession {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.balance = INITIAL_BALANCE;
        this.currentBets = [];
        this.gameHistory = [];
        this.totalBetAmount = 0;
        this.winStreak = 0;
        this.lossStreak = 0;
        this.totalWins = 0;
        this.totalLosses = 0;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
    }

    placeBet(betType, numbers, amount) {
        if (amount <= 0 || amount > this.balance) {
            return { success: false, error: 'Invalid bet amount' };
        }

        const bet = {
            betType,
            numbers,
            amount,
            timestamp: Date.now()
        };

        this.currentBets.push(bet);
        this.totalBetAmount += amount;
        this.balance -= amount;
        this.lastActivity = Date.now();

        return { success: true, bet, balance: this.balance, totalBet: this.totalBetAmount };
    }

    clearBets() {
        // Refund all bets
        this.balance += this.totalBetAmount;
        const refundedAmount = this.totalBetAmount;
        this.currentBets = [];
        this.totalBetAmount = 0;
        this.lastActivity = Date.now();

        return { success: true, refundedAmount, balance: this.balance };
    }

    undoLastBet() {
        if (this.currentBets.length === 0) {
            return { success: false, error: 'No bets to undo' };
        }

        const lastBet = this.currentBets.pop();
        this.balance += lastBet.amount;
        this.totalBetAmount -= lastBet.amount;
        this.lastActivity = Date.now();

        return { success: true, bet: lastBet, balance: this.balance, totalBet: this.totalBetAmount };
    }

    processSpin(winningNumber) {
        let totalWinnings = 0;
        const winningBets = [];

        // Calculate winnings for each bet
        this.currentBets.forEach(bet => {
            const payout = this.calculatePayout(bet, winningNumber);
            if (payout > 0) {
                totalWinnings += payout;
                winningBets.push({ ...bet, payout });
            }
        });

        // Update balance with winnings
        this.balance += totalWinnings;

        // Update statistics
        if (totalWinnings > 0) {
            this.totalWins++;
            this.winStreak++;
            this.lossStreak = 0;
        } else {
            this.totalLosses++;
            this.lossStreak++;
            this.winStreak = 0;
        }

        // Record game history
        const historyEntry = {
            winningNumber,
            bets: this.currentBets,
            totalBetAmount: this.totalBetAmount,
            totalWinnings,
            netProfit: totalWinnings - this.totalBetAmount,
            balance: this.balance,
            timestamp: Date.now()
        };
        this.gameHistory.push(historyEntry);

        // Keep only last 50 spins in history
        if (this.gameHistory.length > 50) {
            this.gameHistory.shift();
        }

        // Clear bets for next round
        this.currentBets = [];
        this.totalBetAmount = 0;
        this.lastActivity = Date.now();

        return {
            winningNumber,
            totalWinnings,
            winningBets,
            balance: this.balance,
            history: historyEntry
        };
    }

    calculatePayout(bet, winningNumber) {
        const { numbers, amount } = bet;

        // Check if bet includes winning number
        if (!numbers.includes(winningNumber)) {
            return 0; // Losing bet
        }

        // Calculate payout based on bet type (number of numbers covered)
        const count = numbers.length;
        let multiplier = 0;

        switch (count) {
            case 1:  // Straight bet
                multiplier = 36; // 35:1 + original bet
                break;
            case 2:  // Split bet
                multiplier = 18; // 17:1 + original bet
                break;
            case 3:  // Street bet
                multiplier = 12; // 11:1 + original bet
                break;
            case 4:  // Corner bet
                multiplier = 9;  // 8:1 + original bet
                break;
            case 6:  // Line bet
                multiplier = 6;  // 5:1 + original bet
                break;
            case 12: // Dozen or Column bet
                multiplier = 3;  // 2:1 + original bet
                break;
            case 18: // Even money bets (red/black, odd/even, high/low)
                multiplier = 2;  // 1:1 + original bet
                break;
            default:
                multiplier = 0;
        }

        return amount * multiplier;
    }

    getStatistics() {
        return {
            balance: this.balance,
            totalBetAmount: this.totalBetAmount,
            totalWins: this.totalWins,
            totalLosses: this.totalLosses,
            winStreak: this.winStreak,
            lossStreak: this.lossStreak,
            gamesPlayed: this.gameHistory.length,
            recentHistory: this.gameHistory.slice(-10)
        };
    }
}

/**
 * Roulette Server - Manages game state and sessions
 */
class RouletteServer {
    constructor() {
        this.sessions = new Map();
        this.cleanupInterval = null;
    }

    start() {
        // Initialize Express app
        const app = express();
        app.use(express.json());
        app.use(express.static(path.join(__dirname, 'dist')));

        // Create HTTP server
        const server = http.createServer(app);

        // Create WebSocket server
        const wss = new WebSocket.Server({ server });

        // WebSocket connection handler
        wss.on('connection', (ws) => {
            console.log('Client connected');
            let sessionId = null;

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    const response = this.handleMessage(ws, message, sessionId);
                    
                    if (response && response.sessionId) {
                        sessionId = response.sessionId;
                    }

                    if (response && response.reply) {
                        ws.send(JSON.stringify(response.reply));
                    }
                } catch (error) {
                    console.error('Message handling error:', error);
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        // Start cleanup interval (remove inactive sessions)
        this.cleanupInterval = setInterval(() => {
            this.cleanupInactiveSessions();
        }, 60000); // Every minute

        // Start server
        server.listen(PORT, () => {
            console.log(`\nFull-Featured Roulette Server`);
            console.log(`=============================`);
            console.log(`HTTP Server: http://localhost:${PORT}`);
            console.log(`WebSocket Server: ws://localhost:${PORT}`);
            console.log(`Features: Session management, RNG, Win calculation, History tracking`);
            console.log(`Chip Denominations: ${CHIP_DENOMINATIONS.map(c => `${c}¢`).join(', ')}`);
            console.log(`Initial Balance: $${(INITIAL_BALANCE / 100).toFixed(2)}`);
            console.log(`\n`);
        });
    }

    handleMessage(ws, message, currentSessionId) {
        const { cmdid } = message;

        switch (cmdid) {
            case 'flblogin':
                return this.handleLogin(message);
            
            case 'comeingame3':
                return this.handleEnterGame(message, currentSessionId);
            
            case 'placebet':
                return this.handlePlaceBet(message, currentSessionId);
            
            case 'clearbet':
                return this.handleClearBets(message, currentSessionId);
            
            case 'undobet':
                return this.handleUndoBet(message, currentSessionId);
            
            case 'spin':
                return this.handleSpin(message, currentSessionId);
            
            case 'gethistory':
                return this.handleGetHistory(message, currentSessionId);
            
            case 'getstats':
                return this.handleGetStatistics(message, currentSessionId);
            
            case 'keepalive':
                return this.handleKeepAlive(message, currentSessionId);
            
            default:
                return { reply: { error: 'Unknown command' } };
        }
    }

    handleLogin(message) {
        const sessionId = this.generateSessionId();
        const session = new PlayerSession(sessionId);
        this.sessions.set(sessionId, session);

        return {
            sessionId,
            reply: {
                cmd: 'loginret',
                success: true,
                sessionId,
                balance: session.balance
            }
        };
    }

    handleEnterGame(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            const newSessionId = this.generateSessionId();
            const session = new PlayerSession(newSessionId);
            this.sessions.set(newSessionId, session);
            sessionId = newSessionId;
        }

        const session = this.sessions.get(sessionId);

        return {
            sessionId,
            reply: {
                cmd: 'gameconfigret',
                balance: session.balance,
                linebets: CHIP_DENOMINATIONS,
                minBet: CHIP_DENOMINATIONS[0],
                maxBet: session.balance,
                tableId: message.tableid || 'default'
            }
        };
    }

    handlePlaceBet(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            return { reply: { cmd: 'placebetret', success: false, error: 'Invalid session' } };
        }

        const session = this.sessions.get(sessionId);
        const { betType, numbers, amount } = message;

        const result = session.placeBet(betType, numbers, amount);

        return {
            reply: {
                cmd: 'placebetret',
                ...result
            }
        };
    }

    handleClearBets(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            return { reply: { cmd: 'clearbetret', success: false, error: 'Invalid session' } };
        }

        const session = this.sessions.get(sessionId);
        const result = session.clearBets();

        return {
            reply: {
                cmd: 'clearbetret',
                ...result
            }
        };
    }

    handleUndoBet(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            return { reply: { cmd: 'undobetret', success: false, error: 'Invalid session' } };
        }

        const session = this.sessions.get(sessionId);
        const result = session.undoLastBet();

        return {
            reply: {
                cmd: 'undobetret',
                ...result
            }
        };
    }

    handleSpin(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            return { reply: { cmd: 'spinret', success: false, error: 'Invalid session' } };
        }

        const session = this.sessions.get(sessionId);

        if (session.currentBets.length === 0) {
            return { reply: { cmd: 'spinret', success: false, error: 'No bets placed' } };
        }

        // Generate random winning number using cryptographically secure RNG
        const winningNumber = this.generateWinningNumber();

        // Process spin and calculate winnings
        const result = session.processSpin(winningNumber);

        return {
            reply: {
                cmd: 'spinret',
                success: true,
                ...result
            }
        };
    }

    handleGetHistory(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            return { reply: { cmd: 'historyret', success: false, error: 'Invalid session' } };
        }

        const session = this.sessions.get(sessionId);
        const { limit = 10 } = message;

        return {
            reply: {
                cmd: 'historyret',
                success: true,
                history: session.gameHistory.slice(-limit)
            }
        };
    }

    handleGetStatistics(message, sessionId) {
        if (!sessionId || !this.sessions.has(sessionId)) {
            return { reply: { cmd: 'statsret', success: false, error: 'Invalid session' } };
        }

        const session = this.sessions.get(sessionId);
        const stats = session.getStatistics();

        return {
            reply: {
                cmd: 'statsret',
                success: true,
                ...stats
            }
        };
    }

    handleKeepAlive(message, sessionId) {
        if (sessionId && this.sessions.has(sessionId)) {
            const session = this.sessions.get(sessionId);
            session.lastActivity = Date.now();
        }

        return { reply: { cmd: 'keepaliveret', success: true } };
    }

    /**
     * Generate cryptographically secure random winning number
     */
    generateWinningNumber() {
        // Use crypto.randomInt for cryptographically secure randomness
        const randomIndex = crypto.randomInt(0, ROULETTE_NUMBERS.length);
        return ROULETTE_NUMBERS[randomIndex];
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Clean up inactive sessions (no activity for 30 minutes)
     */
    cleanupInactiveSessions() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActivity > timeout) {
                console.log(`Cleaning up inactive session: ${sessionId}`);
                this.sessions.delete(sessionId);
            }
        }
    }

    /**
     * Shutdown server gracefully
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        console.log('Server shutting down...');
    }
}

// Start server
const server = new RouletteServer();
server.start();

// Handle shutdown
process.on('SIGINT', () => {
    server.shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    server.shutdown();
    process.exit(0);
});

module.exports = RouletteServer;
