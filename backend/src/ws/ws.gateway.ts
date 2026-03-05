import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinBoard')
    handleJoinBoard(client: Socket, challengeId: string) {
        client.join(`challenge:${challengeId}`);
    }

    emitLeaderboardUpdate(challengeId: string, top10: any[]) {
        this.server.to(`challenge:${challengeId}`).emit('leaderboard:update', {
            challengeId,
            top10,
        });
    }

    emitSubmissionResult(userId: string, result: any) {
        this.server.emit(`user:${userId}:result`, result);
    }
}
