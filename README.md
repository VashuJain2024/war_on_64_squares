# War on 64 Squares

A real-time multiplayer chess game with voice chat, built using Node.js, Express, Socket.io, and chess.js. Play chess with friends or spectate games, all in your browser.

---

## Features

- **Real-time Multiplayer Chess:** Play chess with anyone by sharing a room ID.
- **Spectator Mode:** Join any room as a spectator if both player slots are filled.
- **Live Board Updates:** All moves are instantly reflected for all players and spectators.
- **Drag-and-Drop Interface:** Move pieces with intuitive drag-and-drop controls.
- **Game State Sync:** Join an ongoing game and instantly see the current board.
- **Restart Game:** Players can restart the game at any time.
- **Voice Chat:** Built-in peer-to-peer voice chat for players in the same room.
- **Responsive UI:** Works on desktop and mobile browsers.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd Chess
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Build Tailwind CSS (if needed):**
   ```sh
   npx tailwindcss -i ./public/css/tailwind.css -o ./public/css/output.css --watch
   ```
   > _You can skip this step if output.css is already present._

4. **Start the server:**
   ```sh
   npm start
   ```

5. **Open your browser and go to:**
   [http://localhost:3000](http://localhost:3000)

---

## How to Play

1. **Enter a Room ID:**
   - On page load, enter a unique Room ID to create or join a game room.
2. **Share the Room ID:**
   - Share the Room ID with your friend to play together.
3. **Player Roles:**
   - The first to join is White, the second is Black. Others join as spectators.
4. **Move Pieces:**
   - Drag and drop pieces to make moves. Legal moves are enforced.
5. **Restart Game:**
   - Players can restart the game using the Restart button.
6. **Voice Chat:**
   - Click 'Start Voice' to enable voice chat. Allow microphone access when prompted.
   - Use 'Mute' to toggle your microphone.

---

## Project Structure

- `app.js` — Main server file (Express + Socket.io)
- `public/` — Static assets (CSS, JS)
  - `js/chessgame.js` — Frontend logic for chess and voice chat
  - `css/` — Tailwind CSS files
- `views/index.ejs` — Main HTML template
- `package.json` — Project dependencies and scripts

---

## Technologies Used

- **Node.js**
- **Express**
- **Socket.io**
- **chess.js**
- **EJS**
- **Tailwind CSS**
- **WebRTC** (for voice chat)

---

## Live Demo

[Live Link: ](https://waron64squares-production.up.railway.app/)

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## Acknowledgements

- [chess.js](https://github.com/jhlywa/chess.js)
- [Socket.io](https://socket.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [WebRTC](https://webrtc.org/)
