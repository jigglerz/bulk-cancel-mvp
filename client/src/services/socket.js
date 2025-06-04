import { io } from 'socket.io-client';

// Replace localhost with your actual server public IP or domain (since this runs in the browser)
const socket = io('http://13.60.204.82:3000', {
  transports: ['websocket'],
});

// Expose to window for debugging
window.socket = socket;

export default socket;
