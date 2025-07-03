const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

// Store room-wise data
const rooms = {}; // { roomId: { chess, players: { white: socketId, black: socketId }, spectators: [] } }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
        // Create room if doesn't exist
        if (!rooms[roomId]) {
            rooms[roomId] = {
                chess: new Chess(),
                players: {},
                spectators: []
            };
        }

        const room = rooms[roomId];
        socket.join(roomId);

        let role;
        if (!room.players.white) {
            room.players.white = socket.id;
            role = 'w';
        } else if (!room.players.black) {
            room.players.black = socket.id;
            role = 'b';
        } else {
            room.spectators.push(socket.id);
            role = 'spectator';
        }

        socket.emit('playerRole', role);
        socket.emit('boardState', room.chess.fen()); // Sync new joiner with current game

        console.log(`User ${socket.id} joined room ${roomId} as ${role}`);

        // Store roomId in socket for cleanup on disconnect
        socket.data.roomId = roomId;
    });

    socket.on('move', (move) => {
        const roomId = socket.data.roomId;
        const room = rooms[roomId];
        if (!room) return;

        const game = room.chess;
        const { white, black } = room.players;

        if ((game.turn() === 'w' && socket.id !== white) ||
            (game.turn() === 'b' && socket.id !== black)) {
            return;
        }

        try {
            const result = game.move(move);
            if (result) {
                io.to(roomId).emit('move', move);
                io.to(roomId).emit('boardState', game.fen());
            } else {
                throw new Error(`Invalid move: ${JSON.stringify(move)}`);
            }
        } catch (err) {
            console.error('Error during move:', err.message);
            socket.emit('invalidMove', move);
        }
    });

    socket.on('restartGame', () => {
        const roomId = socket.data.roomId;
        const room = rooms[roomId];
        if (!room) return;

        const isPlayer = room.players.white === socket.id || room.players.black === socket.id;
        if (isPlayer) {
            room.chess.reset();
            io.to(roomId).emit('boardState', room.chess.fen());
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        const room = rooms[roomId];
        if (!room) return;

        if (room.players.white === socket.id) {
            delete room.players.white;
        } else if (room.players.black === socket.id) {
            delete room.players.black;
        } else {
            room.spectators = room.spectators.filter(id => id !== socket.id);
        }

        io.to(roomId).emit('playerDisconnected', socket.id);

        const totalUsers =
            Object.keys(room.players).length + room.spectators.length;

        if (totalUsers === 0) {
            delete rooms[roomId]; // Clean up empty room
            console.log(`Room ${roomId} deleted`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
