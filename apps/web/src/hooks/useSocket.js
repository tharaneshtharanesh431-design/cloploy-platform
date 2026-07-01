import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocket(userId, onDeploymentUpdate) {
  useEffect(() => {
    if (!userId) return undefined;
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3121'
        : window.location.origin)
    );
    socket.emit('join:user', userId);
    socket.on('deployment:update', onDeploymentUpdate);
    return () => socket.disconnect();
  }, [userId, onDeploymentUpdate]);
}
