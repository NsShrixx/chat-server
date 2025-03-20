const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Initialize the app and the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active users and their sockets
let users = [];
let messages = [];

// Serve static files (like index.html)
app.use(express.static('public'));

// Handle a new socket connection
io.on('connection', (socket) => {
  console.log('New user connected');

  // Set the username when the user joins
  socket.on('setUsername', (username) => {
    const user = { username, socketId: socket.id, avatar: '', status: 'online' };

    // Check if the username already exists
    if (users.some(u => u.username === username)) {
      socket.emit('usernameTaken');
    } else {
      users.push(user);
      io.emit('userList', users); // Broadcast updated user list to everyone
      socket.emit('setUsername', { username }); // Send back the username
      console.log(`${username} joined the chat`);
    }
  });

  // Handle a new chat message
  socket.on('chatMessage', (message) => {
    const username = users.find(user => user.socketId === socket.id)?.username;
    if (username) {
      const messageId = Math.random().toString(36).substring(2, 15); // Generate unique message ID
      const messageData = { user: username, message: message, messageId };
      messages.push(messageData);
      io.emit('chatMessage', messageData); // Broadcast message to all clients
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const userIndex = users.findIndex(user => user.socketId === socket.id);
    if (userIndex !== -1) {
      const username = users[userIndex].username;
      users.splice(userIndex, 1);
      io.emit('userList', users); // Broadcast updated user list to everyone
      console.log(`${username} disconnected`);
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
