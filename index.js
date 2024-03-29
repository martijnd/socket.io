const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let games = {};

io.on("connection", function (socket) {
  console.log(`A user with ID: ${socket.id} connected`);
  socket.on("join", ({ code }) => {
    if (games[code]) {
      socket.emit("accepted", "O");
      games = { ...games, [code]: { ...games[code], O: socket.id } };
      console.log(`emitting player-accepted to ${games[code].X}`)
      io.to(games[code].X).emit('player-accepted');
    } else {
      socket.emit("accepted", "X");
      games = { ...games, [code]: { X: socket.id } };
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`A user with ID: ${socket.id} disconnected`);
    const code = Object.entries(games).find(([key, value]) => {
      return value.X === socket.id || value.O === socket.id;
    })?.[0];

    if (code && games[code]) {
      io.to(games[code].X).emit("disconnected");
      io.to(games[code].O).emit("disconnected");
    }
    delete games[code];
  });

  // Place mark
  socket.on("place-mark", ({ code, boardIndex, cellIndex, player }) => {
    console.log("place-mark", { code, boardIndex, cellIndex, player });
    io.emit("place-mark", { code, boardIndex, cellIndex, player });
  });
});

http.listen(process.env.PORT || 3001, () => {
  console.log("Listening on port *: 3001");
});
