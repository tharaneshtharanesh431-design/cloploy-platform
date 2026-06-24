import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocket(userId, onDeploymentUpdate) {
  useEffect(() => {
    if (!userId) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3232');
    socket.emit('join:user', userId);
    socket.on('deployment:update', onDeploymentUpdate);
    return () => socket.disconnect();
  }, [userId, onDeploymentUpdate]);
}
