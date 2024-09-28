const socket = io(); // Establish a connection to the Socket.io server
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const saveButton = document.getElementById('saveButton');
const timeDisplay = document.getElementById('time');
const usernameInput = document.getElementById('usernameInput'); // Ensure usernameInput is defined

let isTabVisible = true;
let unreadCount = 0;
const targetTime = new Date();
targetTime.setHours(23, 10, 0, 0);

document.addEventListener('visibilitychange', function() {
	if (document.hidden) {
		isTabVisible = false;
		console.log('User is not on the tab');
	} else {
		isTabVisible = true;
		console.log('User is back on the tab');
		// Fade out unread messages
		const unreadMessages = document.querySelectorAll('.unread');
		unreadMessages.forEach(messageElement => {
			messageElement.classList.remove('unread');
			messageElement.classList.add('fade-out'); // Add fade-out class for transition
		});
	}
});

function updateCountdown() {
	const now = new Date();
	const timeDiff = targetTime - now;
	if (timeDiff < 0) {
		clearInterval(countdownInterval);
		timeDisplay.textContent = "Time's up!";
		return;
	}
	const hours = String(Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
	const minutes = String(Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
	const seconds = String(Math.floor((timeDiff % (1000 * 60)) / 1000)).padStart(2, '0');
	const formattedTime = targetTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
	const formattedCountdown = `${hours}:${minutes}:${seconds}`;
	timeDisplay.textContent = `${formattedTime} - ${formattedCountdown}`;
}

const countdownInterval = setInterval(updateCountdown, 1000);

// Function to display messages
function displayMessage(message) {
	const messageElement = document.createElement('div');
	messageElement.textContent = message;
	messagesDiv.appendChild(messageElement);
	if (!isTabVisible) {
		messageElement.classList.add('unread');
		unreadCount++; // Increment the unread message count
		console.log(unreadCount);
	}
}

// Handle incoming messages
socket.on('message', function(message) {
	displayMessage(message);
});

// Handle incoming saved messages
socket.on('loadMessages', function(savedMessages) {
	savedMessages.forEach(message => {
		displayMessage(message);
	});
});

// Handle "Send" button click
sendButton.addEventListener('click', sendMessage);

// Set username when the input is filled
usernameInput.addEventListener('change', () => {
	const customUsername = usernameInput.value.trim();
	if (customUsername) {
		socket.emit('setUsername', customUsername);
		// Emit custom username to server
	}
});

saveButton.addEventListener('click', function() {
	const message = messageInput.value.trim();
	// Get the trimmed input message
	messageInput.value = `/save/${message}`;
	// Add /save/ prefix directly to the input field
	sendMessage(); // Call the existing sendMessage function
});

function sendMessage() {
	const message = messageInput.value.trim(); // Get the trimmed input message
	if (message.startsWith('/save/')) {
		const trimmedMessage = message.replace('/save/', ''); // Remove '/save/' part
		socket.emit('saveMessage', trimmedMessage); // Emit to save the message
		socket.emit('message', trimmedMessage); // Also emit to display it
	} else {
		socket.emit('message', message); // Send regular messages
	}
	messageInput.value = ''; // Clear the input field
}

// Upon page load, notify server about new user
window.onload = function() {
	socket.emit('newUser'); // Notify server that a new user has connected
	socket.emit('loadMessages'); // Load previously saved messages
};
