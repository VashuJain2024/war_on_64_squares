const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
const turnName = document.querySelector('.turnName');
const playerrole = document.querySelector('.playerrole');
const roomid = document.querySelector('.roomid');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

let roomId = null;
while (!roomId) {
    roomId = prompt("Enter a Room ID to join or create:");
}
socket.emit('joinRoom', roomId);
if (roomId) {
    roomid.innerText = `Room ID: ${roomId}`;
}

function checkGameOver() {
    if (chess.game_over()) {
        let message = 'Game Over: ';
        if (chess.in_checkmate()) {
            message += (chess.turn() === 'w' ? 'Black' : 'White') + ' wins by checkmate.';
        } else if (chess.in_stalemate()) {
            message += 'Draw by stalemate.';
        } else if (chess.in_threefold_repetition()) {
            message += 'Draw by repetition.';
        } else if (chess.insufficient_material()) {
            message += 'Draw: Insufficient material.';
        } else if (chess.in_draw()) {
            message += 'Draw.';
        }
        alert(message);
    }
}

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = (playerRole === square.color);

                pieceElement.addEventListener('dragstart', (e) => {
                    if (!pieceElement.draggable) return;
                    draggedPiece = pieceElement;
                    sourceSquare = { row: rowIndex, col: colIndex };
                    e.dataTransfer.setData('text/plain', "");
                });

                pieceElement.addEventListener('dragend', () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => e.preventDefault());

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const target = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, target);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        playerrole.innerText = 'You are playing as Black ⚫';
        boardElement.classList.add('flipped');
    } else if (playerRole === 'w') {
        playerrole.innerText = 'You are playing as White ⚪';
        boardElement.classList.remove('flipped');
    } else {
        playerrole.innerText = 'You are a spectator 👀';
        boardElement.classList.remove('flipped');
    }

    turnName.innerText = chess.turn() === 'w' ? "White's Turn" : "Black's Turn";
};

const handleMove = (source, target) => {
    if (!playerRole || playerRole !== chess.turn()) return;

    const from = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const to = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;
    const piece = chess.get(from);

    const move = {
        from,
        to,
        ...(piece && piece.type === 'p' && (to.endsWith('8') || to.endsWith('1')) && { promotion: 'q' })
    };
    socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
    const unicode = {
        p: '♙', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
        P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
    };
    return unicode[piece.type] || '';
};

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
    checkGameOver();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
    checkGameOver();
});

const restartBtn = document.getElementById('restartBtn');

// Show restart button only for players
socket.on('playerRole', (role) => {
    playerRole = role;
    if (role === 'w' || role === 'b') {
        restartBtn.classList.remove('hidden');
    }
    renderBoard();
});

restartBtn.addEventListener('click', () => {
    if (playerRole === 'w' || playerRole === 'b') {
        socket.emit('restartGame');
    }
});

renderBoard();


let localStream;
let peerConnection;
let isMuted = false;

const startBtn = document.getElementById("startBtn");
const muteBtn = document.getElementById("muteBtn");

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

startBtn.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            socket.emit("ice-candidate", { candidate: e.candidate, roomId });
        }
    };

    peerConnection.ontrack = event => {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        document.body.appendChild(audio);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("voice-offer", { offer, roomId });
    startBtn.disabled = true;
    muteBtn.disabled = false;
};

muteBtn.onclick = () => {
    if (!localStream) return;
    localStream.getAudioTracks()[0].enabled = isMuted;
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? "🔊 Unmute" : "🔇 Mute";
};

// Receive offer
socket.on("voice-offer", async ({ offer }) => {
    peerConnection = new RTCPeerConnection(config);

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
        const audio = document.createElement("audio");
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        document.body.appendChild(audio);
    };

    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            socket.emit("ice-candidate", { candidate: e.candidate, roomId });
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("voice-answer", { answer, roomId });
    startBtn.disabled = true;
    muteBtn.disabled = false;
});

socket.on("voice-answer", async ({ answer }) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});