const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

let strokes = [];   // all drawn strokes
let undone = [];    // undone strokes for redo

// Serve static files (index.html, etc.)
app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  // Send current strokes to the new player
  socket.emit("loadStrokes", strokes);

  // Relay drawing strokes to all other players
  socket.on("drawing", (data) => {
    strokes.push(data);           // save stroke (includes color, size, type)
    socket.broadcast.emit("drawing", data);
  });

  // Undo last stroke
  socket.on("undo", () => {
    if (strokes.length > 0) {
      undone.push(strokes.pop());
      io.emit("updateStrokes", strokes);
    }
  });

  // Redo last undone stroke
  socket.on("redo", () => {
    if (undone.length > 0) {
      strokes.push(undone.pop());
      io.emit("updateStrokes", strokes);
    }
  });

  // Clear canvas for everyone
  socket.on("clear", () => {
    strokes = [];
    undone = [];
    io.emit("clear");
  });

  // Chat messages
  socket.on("chat", (msg) => {
    io.emit("chat", msg);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

// Listen on all interfaces so phone can connect
const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running! Open on PC: http://localhost:${PORT}`);
  console.log(`Or on phone: http://192.168.11.54:${PORT}`);
});
