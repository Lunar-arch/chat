const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let savedMessages = []; // Store messages on the server
let userCount = 0; // Track the number of connected users
const users = {}; // Store username and socket id mapping

io.on('connection', (socket) => {
    userCount++; // Increment the user count for each connection
    let username = `User ${userCount}`; // Default username
    console.log(`${username} connected`);

    socket.on('setUsername', (customUsername) => {
        username = customUsername; // Update the username to the custom one
        users[socket.id] = username; // Map socket id to username
        console.log('User', `${userCount} is now ${username}`); // Inform the user
    });

    socket.emit('loadMessages', savedMessages); // Send saved messages to the newly connected user

    // Notify all clients about the new user
    io.emit('message', `${username} has joined the chat`);

    socket.on('message', (msg) => {
        io.emit('message', `${username}: ${msg}`); // Include the username in the broadcasted message
    });

    socket.on('saveMessage', (msgToSave) => {
        savedMessages.push(msgToSave); // Save the message content
        console.log(`Message saved: ${msgToSave}`); // Log saved messages
    });

    socket.on('disconnect', () => {
        console.log(`${username} disconnected`);
        delete users[socket.id]; // Clean up user data on disconnect
    });
});

// Serve static files from the "public" directory
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
