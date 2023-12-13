import {
	ArgumentsHost,
	CanActivate,
	Catch,
	ExceptionFilter,
	ExecutionContext,
	Injectable,
	UnauthorizedException} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "../constants";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { PrismaService } from "src/prisma.service";
import { Socket, Server } from 'socket.io'


@WebSocketGateway({namespace: 'error', cors: true})
export class ErrorService
implements OnGatewayConnection, OnGatewayDisconnect{

	@WebSocketServer() server: Server;
	cliendId = ""

	constructor() {

	}

	handleDisconnect(client: any) {
	}

	handleConnection(client: any) {
		this.cliendId = client.id
	}


	async disconnectClient() {
		this.server.emit(`${this.cliendId} disconnect`)
	}
}


@Catch(WsException)
export class WSAuthFilter implements ExceptionFilter {

	@WebSocketServer() server: Server;
	catch(exception: WsException, host: ArgumentsHost) {
		const client = host.switchToWs().getClient() as WebSocket;
		client.send(JSON.stringify({ status: "unautorized", msg: "" }))
	}
}

@Injectable()
export class GatewayGuard implements CanActivate {

	constructor(private jwtService: JwtService, private prisma: PrismaService, private ErrorService: ErrorService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromAuth(request);

		if (!token) {
			throw new UnauthorizedException('Invalid credentials !');
		}

		try
		{
			const payload = await this.jwtService.verifyAsync(token, {
			secret: jwtConstants.secret});

			if (!payload || !payload.sub) {
				throw new UnauthorizedException('Not identified');
			}

			const user = await this.prisma.user.findUniqueOrThrow({where: {id: payload.sub}})

			if (user.tfa && !payload.isTfaAuthentificated) {
				throw new UnauthorizedException();
			}
			request["user"] = payload;
		}


		catch {
			const client = context.switchToWs().getClient() as WebSocket;

			this.ErrorService.disconnectClient()
			throw  new WsException('Invalid user !');
		}
		return true;

	}

	private extractTokenFromAuth(request: Socket): string | undefined {
		const token = request.handshake.auth.access_token;
		return token;
	}
}
