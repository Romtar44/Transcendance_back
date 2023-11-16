import { ConnectedSocket,
			MessageBody,
			OnGatewayConnection,
			OnGatewayDisconnect,
			SubscribeMessage,
			WebSocketGateway,
			WebSocketServer,
			} from "@nestjs/websockets";
import { Socket, Server } from 'socket.io'
import { forwardRef, Inject, UseGuards } from "@nestjs/common";
import { GatewayGuard} from "../auth/guards/gateway.guard";
import { ConversationService } from "../social/conversation/conversation.service";
import { ProfilService } from "../profil/profil.service";
import {  e_log_status, e_match_player, Profil } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { verifyToken } from "../lib/utils";
import { PrismaService } from "../prisma.service";
import { ChannelService } from "../social/channel/channel.service";
import { MessageService } from "../social/message/message.service";
import { GameService, InitGame } from "../game/game.service";


@WebSocketGateway({namespace: 'status', cors: true})
export class StatusGatewayService
implements OnGatewayConnection, OnGatewayDisconnect {


	@WebSocketServer() server: Server;

	constructor(private readonly profilService: ProfilService,
		private readonly jwtService : JwtService,
		private readonly prisma: PrismaService) {}


		async handleConnection(@ConnectedSocket() socket: Socket)
		{
			const userPayload = await verifyToken(socket, this.jwtService, this.prisma)
			if (!userPayload || !userPayload.sub)
				return
			try
			{
				const userId = userPayload.sub
				const user = await this.prisma.user.update({
					where: { id: userId }, 
					data: { socketNumber: { increment: 1 }},
					select: {socketGameNumber: true, socketNumber: true}
				})

				if (user.socketNumber > 1)
					return "sucess"
				
				if (user.socketGameNumber > 1){
					await this.profilService.modifyStatus("PLAYING", userId)
					this.server.emit(`${userId}`, "PLAYING")
					return
				}
				await this.profilService.modifyStatus("ONLINE", userId)
				this.server.emit(`${userId}`, "ONLINE")

				return "success"
			}
			catch (error)
			{
				return error
			}
		}


	@UseGuards(GatewayGuard)
	async handleDisconnect(@ConnectedSocket() socket: Socket)
	{
		const userPayload = await verifyToken(socket, this.jwtService, this.prisma)
		if (!userPayload || !userPayload.sub)
			return
		try
		{
			const userId = userPayload.sub
			const user = await this.prisma.user.update({where: { id: userId }, data: { socketNumber: { decrement: 1 }}})


			if (user.socketNumber === 0)
			{
				await this.profilService.modifyStatus("OFFLINE", userId)
				this.server.emit(`${userId}`, "OFFLINE")
			}

			return "success"
		}
		catch (error)
		{
			return error
		}
	}

	async setStatus (status: e_log_status, userId: string)
	{
		await this.profilService.modifyStatus(status, userId)
		this.server.emit(`${userId}`, status)
	}

	@SubscribeMessage('changeStatus')
	async handleStatus(@MessageBody() data:{status: e_log_status},
					@ConnectedSocket() socket: Socket)
	{
		try
		{
			const userId = (socket as any).user.sub
			await this.profilService.modifyStatus(data.status, userId)
			this.server.emit(userId, data.status)

			return "success"
		}
		catch (error)
		{
			return error
		}
	}
}



@WebSocketGateway({namespace: 'game', cors: true})
export class GameGatewayService implements OnGatewayDisconnect, OnGatewayConnection
{
	games: {id : string, gameService: GameService}[]

	@WebSocketServer() server: Server;

	constructor(
		private readonly jwtService : JwtService,
		private readonly prisma: PrismaService,
		private readonly statusGuatewayService: StatusGatewayService) {
		this.games = []
	}


	async handleConnection(@ConnectedSocket() socket: Socket, ...args: any[])
	{
		const userPayload = await verifyToken(socket, this.jwtService, this.prisma)
		if (!userPayload)
		{
			socket.disconnect()
			return ({status: "error", msg: "unauthorized"})
		}
		const game = this.games.find((game) => game.id === socket.handshake.auth.gameId)
		if (!game || game.gameService.end)
		{
			socket.disconnect()
			return ({status: "error", msg: "game not found"})
		}
		this.statusGuatewayService.setStatus("PLAYING",userPayload.sub)
		this.prisma.user.update({
			where: {id: userPayload.sub},
			data: {
				socketGameNumber: {
					increment: 1
				}
			},
			select: {socketGameNumber: true}
		})
		
		
	}


	async handleDisconnect(@ConnectedSocket() socket: Socket)
	{
		const userPayload = await verifyToken(socket, this.jwtService, this.prisma)
		const user = await this.prisma.user.update({
			where: {id: userPayload.sub},
			data: {
				socketGameNumber: {
					decrement: 1
				}
			},
			select: {socketGameNumber: true}
		})
		if (user.socketGameNumber < 1)
			this.statusGuatewayService.setStatus('ONLINE', userPayload.sub)
		if (!await verifyToken(socket, this.jwtService, this.prisma))
			return ({status: "error", msg: "unauthorized"})
		const game = this.games.find((game) => game.id === socket.handshake.auth.gameId)
		if (!game || game.gameService.end)
		 	return ({status: "error", msg: "game not found"})
		if (socket.handshake.auth.profilId === game.gameService.player1.id)
			this.endGame(game.id, "player1" )
		else if (socket.handshake.auth.profilId === game.gameService.player2.id)
			this.endGame(game.id, "player2" )
		

	}


	async startGame(@MessageBody() data: InitGame)
	{

		const gameService = new GameService(this.prisma)

		gameService.InitGame(data)

		this.games.push({id: gameService.gameId, gameService: gameService})


		while (gameService.player1.ready !== true || gameService.player2.ready !== true)
		{
			await new Promise(f => setTimeout(f, 500));
		}

		this.server.emit(gameService.gameId, this.getGameState(gameService))
		this.emitScore(gameService.gameId, gameService.player1.points, gameService.player2.points)
		await new Promise(f => setTimeout(f, 5500));
		this.playGame(gameService)

		return this.getGameState(gameService)
	}



	async playGame(gameService: GameService)
	{
		while (!gameService.end)
		{
			await new Promise(f => setTimeout(f, 2));
			const gameCalc = gameService.calcNewBallPos()
			if (gameCalc === 44)
			{
				this.endGame(gameService.gameId)
		  		return
			}
			else if (gameCalc === -1 || gameCalc === 1)
			{
				this.emitScore(gameService.gameId, gameService.player1.points, gameService.player2.points, gameCalc === 1? "player1" :"player2")
				gameService.initBallPos()
				gameService.ballSpeed = gameService.baseBallSpeed
				await new Promise(f => setTimeout(f, 5500));
			}
			if (gameCalc === 7)
				gameService.ballSpeed *= gameService.ballAcceleration
			this.server.emit(gameService.gameId, this.getGameState(gameService))
		}
	}


	async endGame(gameId: string, playerGaveUp?: PlayerStatus)
	{

		const game = this.games.find((game) => game.id === gameId)
		if (!game)
		{
			this.server.emit(`end${gameId}`)
			return
		}
		else if (game.gameService)
		{
			game.gameService.end = true

			let winner: PlayerStatus = game.gameService.player1.points > game.gameService.player2.points ? "player1": "player2"
			if (playerGaveUp)
				winner = playerGaveUp === 'player1' ? "player2" : "player1"

			const finishedGame =  game.gameService.endGame(winner, playerGaveUp ? e_match_player[playerGaveUp]: undefined)

			game.gameService = null
			delete game.gameService
			this.games = this.games.filter((game) => game.id !== gameId)


			this.server.emit(`end${gameId}`,  await finishedGame)
		}
	}


	@SubscribeMessage('player1MovePaddle')
	async player1MovePaddle(@MessageBody() data:{gameId: string, posY: number },
					@ConnectedSocket() socket: Socket)
	{

		const game = this.games.find((game) => game.id === data.gameId)
		if (!game || game.gameService.end)
			return ({status: "error", msg: "game not found"})
		if (game.gameService.player1.ready && game.gameService.player2.ready)
			game.gameService.player1.paddlePosY = data.posY

	}

	@SubscribeMessage('player2MovePaddle')
	async player2MovePaddle(@MessageBody() data:{gameId: string, posY: number },
					@ConnectedSocket() socket: Socket)
	{
		const game = this.games.find((game) => game.id === data.gameId)
		if (!game || game.gameService.end)
			return ({status: "error", msg: "game not found"})

		if (game.gameService.player1.ready && game.gameService.player2.ready)
			game.gameService.player2.paddlePosY = data.posY

	}


	getGameState(gameService: GameService)
	{
		return {
			gameId: gameService.gameId,
			state: "in progress",
			ball:{
				posX: gameService.posBallX,
				posY: gameService.posBallY,
				diameter: gameService.ballSize
			},

			paddleHeight: gameService.paddleHeigt,
			paddleWidth: gameService.paddleWith,

			player1: {
				id: gameService.player1.id,
				paddlePosX: gameService.player1.paddlePosX,
				paddlePosY:  gameService.player1.paddlePosY,
				points: gameService.player1.points,
				username: gameService.player1.username
			},

			player2:  {
				id: gameService.player2.id,
				paddlePosX: gameService.player2.paddlePosX,
				paddlePosY:  gameService.player2.paddlePosY,
				points: gameService.player2.points,
				username: gameService.player2.username
			},
		}
	}


	emitScore(gameId: string, player1Score: number, player2Score: number, winner?: PlayerStatus) {
		this.server.emit(`${gameId}score`, {player1Score, player2Score, winner})
	}



	@SubscribeMessage('ready')
	async setReady(@MessageBody() data:{gameId: string, player: PlayerStatus })
	{
		const game = this.games.find((game) => game.id === data.gameId)
		game.gameService[data.player].ready = true
	}


	@SubscribeMessage('endGame')
	async giveUP(@MessageBody() data:{gameId: string, player: PlayerStatus })
	{
		this.endGame(data.gameId, data.player)
		
	}
}


@WebSocketGateway({namespace: 'chat', cors: true})
export class ChatGatewayService
implements OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer() server: Server;

	constructor(private readonly conversationService: ConversationService,
		private readonly jwtService : JwtService, private prisma: PrismaService,
		private messageService: MessageService) {}

	async handleConnection(@ConnectedSocket() socket: Socket)
	{
		const userPayload = await verifyToken(socket, this.jwtService, this.prisma)
		if (!userPayload || !userPayload.sub)
			return
	}


	@UseGuards(GatewayGuard)
	handleDisconnect() {
	}

	@UseGuards(GatewayGuard)
	@SubscribeMessage('sendMessage')
	async handleMessage(@MessageBody() data:{message: string, receiverId: string},
					@ConnectedSocket() socket: Socket)
	{
		const userId = (socket as any).user.sub
		const newMessage = await this.conversationService.addMessage(userId,
			data.receiverId, data.message)
		if (newMessage)
		{
			this.server.emit(`${userId}`, newMessage)

			return {status: "success", msg: newMessage}
		}

		return {status: "error", msg: data.message}
	}

	@UseGuards(GatewayGuard)
	@SubscribeMessage('seeConv')
	async seeMessage(@MessageBody() data:{convId: string}, @ConnectedSocket() socket: Socket)
	{
		if (!data.convId)
			return {status: "success", newConv: undefined}
		const conv = await this.messageService.seeMessages(data.convId)

		return {status: "success", newConv: conv}
	}

}

export type PlayerStatus = "player1" |"player2"


@WebSocketGateway({namespace: 'friend', cors: true})
export class FriendGatewayService {

	@WebSocketServer() server: Server;

	matchmakingAwait: string[] = []



	async updateFriendList(userId: string)
	{
		this.server.emit(userId)
	}

	async inviteGame(gameId: string, adversaire: Profil, customVar?: Object) {
		this.server.emit(`invitePlay${adversaire.userId}`, {adversaire, gameId, customVar})
		await new Promise(f => setTimeout(f, 20000))
		this.server.emit(`refused${gameId}`)
		

	}

	acceptGame(gameId: string) {
		this.server.emit(`accept${gameId}` )
	}


	@UseGuards(GatewayGuard)
	@SubscribeMessage('refuseGame')
	refuseGame(@MessageBody() gameId: string) {
		this.server.emit(`refused${gameId}` )
		return "refused"
	}



	foundMatchMaking(gameId: string, user: Profil) {
		this.server.emit(`foundMatch${user.userId}`, gameId)
	}

}

@WebSocketGateway({namespace: 'channel', cors: true})
export class ChannelGatewayService {

	@WebSocketServer() server: Server;

	constructor(@Inject(forwardRef(() => ChannelService))
		private channelService: ChannelService,) {}

	async updateChannelList(channelId: string)
	{
		this.server.emit(channelId)
	}

	@UseGuards(GatewayGuard)
	@SubscribeMessage('sendMessageChannel')
	async handleMessage(@MessageBody() data:{message: string, channelId: string},
					@ConnectedSocket() socket: Socket)
	{
		const userId = (socket as any).user.sub

		const newMessage = await this.channelService.addMessage(userId,
			data.channelId, data.message)
		if (newMessage)
		{
			this.server.emit(`message on ${data.channelId}`, newMessage)
			return {status: "success", msg: newMessage}
		}

		return {status: "error", msg: data.message}
	}
}
