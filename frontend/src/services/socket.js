import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket;

export const initializeSocket = (userId) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // connected
    if (userId) socket.emit('join-user', userId);
    toast.success('Real-time connected', { icon: '🔌', duration: 2000 });
  });

  socket.on('disconnect', () => {
    // disconnected
  });

  // Generic event handlers
  const handleEvent = (eventName, toastOpts) => (data) => {
    if (toastOpts?.type === 'success') toast.success(data.message, toastOpts.options || {});
    if (toastOpts?.type === 'info') toast.info(data.message, toastOpts.options || {});
    window.dispatchEvent(new CustomEvent(eventName, { detail: data.data }));
  };

  socket.on(
    'lead-created',
    handleEvent('leadCreated', { type: 'success', options: { icon: '🆕', duration: 5000 } })
  );
  socket.on(
    'lead-status-updated',
    handleEvent('leadStatusUpdated', { type: 'info', options: { icon: '🔄', duration: 4000 } })
  );
  socket.on(
    'note-added',
    handleEvent('noteAdded', { type: 'success', options: { icon: '📝', duration: 4000 } })
  );

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
