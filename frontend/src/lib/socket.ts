import { io } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://34.172.142.110:3001";

export const getSocket = () => {
    const socket = io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
    });
    return socket;
};
