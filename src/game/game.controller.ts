import { Controller, Get, UseGuards, Request, Body, Put, Res, Param, HttpException, HttpStatus } from '@nestjs/common';
import { MyAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import { FriendGatewayService, GameGatewayService } from 'src/gateways/events.gateway';
import { Response  } from 'express'
import { GameService } from './game.service';
import { defyDTO, startGameDTO } from 'src/lib/DTOs/game.dto';
import { UserService } from 'src/user/user.service';
import { SocialService } from 'src/social/social.service';
import { PrismaService } from 'src/prisma.service';
import { Match } from '@prisma/client';
import { matchSelect } from 'src/lib/select';



@Controller('game')
export class GameController {

	defaultGameVar = {
		paddleHeight: 40,
		paddleWidth: 7,
		ballSpeed: 2,
		ballSize: 4,
		ballAcceleration: 1,
		pointLimit: 10
	}


	matchmakingAwait: string[]

	constructor(private readonly gameService: GameService,
		private gameGuatewayService: GameGatewayService,
		private friendGatewayService: FriendGatewayService,
		private socialService: SocialService,
		private userService: UserService,
		private prisma: PrismaService) {
			this.matchmakingAwait = []
		}


	@UseGuards(MyAuthGuard)
	@Get("/getPlayingGame/:id")
	async getGame(@Param("id") gameId: string, @Request() req: any )
	{
		const game = this.gameGuatewayService.games.find((game) => game.id === gameId)

		if (!game)
		{
			const gameInDb = await this.gameService.findMatch(gameId)

			if (!gameInDb)
				throw new HttpException("Game not found",
					HttpStatus.NOT_FOUND)
			else
				return {status: "game finished", userGameState: gameInDb}
		}
		const currentGame = this.gameGuatewayService.getGameState(game.gameService)
		return {status: "game in progress", userGameState: currentGame}
	}

	@UseGuards(MyAuthGuard)
	@Put("/startGame")
	async startGame(@Request() req: any,
		@Body() body: startGameDTO) {

		const game = await this.gameService.findMatch(body.gameId)
		let gameVar = this.defaultGameVar
		if (body.custom)
			gameVar  = {
				...this.defaultGameVar,
				paddleHeight: body.paddleHeight,
				ballSpeed: body.ballSpeed,
				ballAcceleration: body.ballAcceleration,
				pointLimit: body.pointLimit
			}
		if (game)
		{
				this.gameGuatewayService.startGame({
				...gameVar,
				gameId: game.id,
				player1Id: game.players[0].id === game.player1ProfilId ? game.players[0].id : game.players[1].id,
				player2Id: game.players[0].id !== game.player1ProfilId ? game.players[0].id : game.players[1].id,
				player1Username: game.players[0].id === game.player1ProfilId ? game.players[0].userName : game.players[1].userName,
				player2Username:  game.players[0].id !== game.player1ProfilId ? game.players[0].userName : game.players[1].userName,
				userId1: game.players[0].id === game.player1ProfilId ? game.players[0].userId : game.players[1].userId,
				userId2: game.players[0].id !== game.player1ProfilId ? game.players[0].userId : game.players[1].userId
			})
			this.friendGatewayService.acceptGame(body.gameId)
			return ("ok")
		}
	}



	@UseGuards(MyAuthGuard)
	@Put("/defy")
	async defy(@Request() req: any,  @Res() res: Response,
		@Body() body: defyDTO) {
			const game = await this.gameService.createMatch(req.user.sub , body.adversaireId)
			if (game.match)
			{
				let customVar = undefined
				if (body.custom)
					customVar = {
						paddleHeight: body.paddleHeight,
						ballSpeed: body.ballSpeed,
						ballAcceleration: body.ballAcceleration,
						pointLimit: body.pointLimit
					}
				this.friendGatewayService.inviteGame(game.match.id, game.adversaire, customVar )

			}
			res.send(game.match)
	}

	@UseGuards(MyAuthGuard)
	@Put("/matchMaking")
	async matchMaking(@Request() req: any,  @Res() res: Response)
	{
			if (!this.matchmakingAwait.length)
			{
				this.matchmakingAwait.push(req.user.sub)
				res.send({status: "no game found"})
			}
			else if (this.matchmakingAwait[0] !== req.user.sub)
			{
				const createGame = await this.gameService.createMatch(this.matchmakingAwait[0] , req.user.sub)
				const game = createGame.match
				this.gameGuatewayService.startGame({
					...this.defaultGameVar,
					gameId: game.id,
					player1Id: createGame.user.id,
					player2Id:createGame.adversaire.id,
					player1Username: createGame.user.userName,
					player2Username:   createGame.adversaire.userName,
					userId1:  createGame.user.userId,
					userId2: createGame.adversaire.userId,
				})
				this.matchmakingAwait = this.matchmakingAwait.slice(1, this.matchmakingAwait.length)
				if (game )
				{
					while (!this.gameGuatewayService.games.find((currGame) => currGame.id === game.id))
						await new Promise(f => setTimeout(f, 400));
					this.friendGatewayService.foundMatchMaking(game.id, createGame.user)
				}
				res.send({status: "game found", game : game})
			}
	}

	@UseGuards(MyAuthGuard)
	@Put("/leaveMatchMaking")
	filterMatchMaking(@Request() req: any) {
		this.matchmakingAwait = this.matchmakingAwait.filter((userId) => userId !== req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Get("/getWatchableMatch")
	async getWatchableMatch(@Request() req: any)
	{
		const userId = req.user.sub
		const user = await this.userService.findUserById(userId)
		const games = this.gameGuatewayService.games
		const watchableMatch : Match[] = []
		for (const game of games)
		{
			const player1 = await this.userService.findUserByProfilId(game.gameService.player1.id);
			const player2 = await this.userService.findUserByProfilId(game.gameService.player2.id);
			if (!this.socialService.isBlocked(player1.blockList, userId) && !this.socialService.isBlocked(user.blockList, player1.id)
				&& !this.socialService.isBlocked(player2.blockList, userId) && !this.socialService.isBlocked(user.blockList, player2.id))
			{
				const match = await this.prisma.match.findUnique({where: {id: game.id}, select: matchSelect})
				watchableMatch.push(match)
			}
		}
		return watchableMatch
	}





}
