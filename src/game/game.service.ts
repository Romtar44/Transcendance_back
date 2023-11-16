import { Injectable } from '@nestjs/common';
import { e_match_player, Profil } from '@prisma/client';
import { PlayerStatus } from 'src/gateways/events.gateway';
import { matchSelect, profilSelect } from 'src/lib/select';
import { PrismaService } from 'src/prisma.service';


const ranks = [ "🪙 Débutant 🪙" , "🥉 Amateur 🥉" , "🥈 Confirmé 🥈" , "🥇 Expert 🥇" , "🏅 Maître 🏅"]

export type InitGame = {
	userId1: string,
	userId2: string,
	paddleHeight: number,
	paddleWidth: number,
	ballSpeed: number,
	ballAcceleration: number,
	pointLimit: number,
	ballSize: number,
	gameId?: string,
	player1Id : string,
	player2Id : string,
	player1Username: string,
	player2Username: string,
	token?: string,
}

@Injectable()
export class GameService {

	gameId: string

	ballSpeed: number;
	posBallX: number;
	posBallY: number;
	dirBall: number;
	pointLimit: number;
	ballAcceleration: number;
	baseBallSpeed:  number

	end: boolean

	windowWidth?: number
	windowHeight?: number

	player1: {
		id: string,
		username: string,
		paddlePosX?: number,
		paddlePosY?: number,
		ballSpeed?: number,
		points: number;
		countDownLeaveGame: number
		intervalLeaveGame: NodeJS.Timeout | null
		ready: boolean
	}

	player2: {
		id: string,
		username: string,
		paddlePosX?: number,
		paddlePosY?: number,
		ballSpeed?: number,
		points: number;
		countDownLeaveGame: number
		intervalLeaveGame: NodeJS.Timeout | null
		ready: boolean
	}

	paddleHeigt: number;
	paddleWith: number;
	paddlePosX: number;
	ballSize: number;
	watchableMatch: any;

	constructor(
		private prisma: PrismaService) {}

	async findMatch(gameId: string)
	{
		let match = await this.prisma.match.findUnique({
			where: {id: gameId},
			select: matchSelect,
		})

		const sortPlayer = (a: Profil, b: Profil) =>
		{
			if (a.id === match.player1ProfilId)
				return -1
			return 1
		}

		match = {...match, players: match.players.sort(sortPlayer)}

		return match
	}

	async createMatch(userId1: string, userId2: string)
	{
		const profilPlayer1 = await this.prisma.profil.findUniqueOrThrow({
			where: {userId: userId1},
			select: {id: true}
		})
		 const match = await this.prisma.match.create({
			 data: {
				 player1ProfilId: profilPlayer1.id,
				 mode: "NORMAL",
			},
			 select: matchSelect
		})

		const user = await this.prisma.profil.update({
			where: { userId: userId1 },
			data: {
			  matchHistory: {
				connect: {
				  id: match.id,
				},
			  },
			},
		  });



		  const adversaire = await  this.prisma.profil.update({
			where: { userId: userId2 },
			select: profilSelect,
			data: {
			  matchHistory: {
				connect: {
				  id: match.id,
				},
			  },
			},
		  });


		return {match, adversaire, user }
	}


	async InitGame(
		data: InitGame,
	)
	{
		this.gameId = data.gameId
		this.paddleHeigt = data.paddleHeight
		this.paddleWith = data.paddleWidth
		this.pointLimit = data.pointLimit

		this.ballSize = data.ballSize
		

		this.windowWidth = 300
		this.windowHeight = 200


		this.player1 = {
			id: data.player1Id,
			paddlePosX: 30,
			paddlePosY: ( this.windowHeight /  2 ) - ( this.paddleHeigt / 2 ),
			points: 0,
			username: data.player1Username,
			countDownLeaveGame: 10,
			intervalLeaveGame: null,
			ready: false
		}

		this.player2 = {
			id: data.player2Id,
			paddlePosY: ( this.windowHeight /  2 ) - ( this.paddleHeigt / 2 ),
			paddlePosX: this.windowWidth - 30 - this.paddleWith,
			points: 0,
			username: data.player2Username,
			countDownLeaveGame: 10,
			intervalLeaveGame: null,
			ready: false
		}


		this.windowWidth = 300
		this.windowHeight = 200


		this.ballSpeed = data.ballSpeed * 0.15
		this.baseBallSpeed = data.ballSpeed * 0.15
		this.ballAcceleration =  1 + data.ballAcceleration * 0.01

		this.paddlePosX = 30
		this.end  = false

		this.initBallPos()
	}


	initBallPos()
	{
		this.posBallX = this.windowWidth / 2,
		this.posBallY = this.windowHeight / 2,
		this.dirBall = (this.player1.points + this.player2.points) % 2 ? 0 : 180
	}


	calcBallAngle(paddlePosY: number)
	{
		const diffBallPaddle = (paddlePosY + (this.paddleHeigt / 2)) - this.posBallY
		const ratio =  60 / (this.paddleHeigt / 2)

		return diffBallPaddle * ratio
	}


	isballTouchPaddle = (ballPosX: number, ballPosY: number, paddlePosX: number, paddlePosY: number) =>
	{

		if (ballPosY + this.ballSize < paddlePosY || ballPosY - this.ballSize > paddlePosY + this.paddleHeigt)
			return 0
		if (ballPosX - this.ballSize <= paddlePosX + this.paddleWith
		&& ballPosX + this.ballSize >= paddlePosX)
		{
			if (ballPosY + this.ballSize >= paddlePosY || ballPosY - this.ballSize <= paddlePosY )
				return 2

			if ((Math.round(ballPosY - this.ballSize) <= Math.round(paddlePosY  + this.paddleHeigt))  && (Math.round(ballPosY- this.ballSize) >= Math.round((paddlePosY + this.paddleHeigt * 0.7))))
				return 3

			if ((Math.round(ballPosY + this.ballSize) >= Math.round(paddlePosY))  && (Math.round(ballPosY +this.ballSize) <= Math.round((paddlePosY + this.paddleHeigt * 0.7))))
				return 4

			return 1
		}

		return 0
	}

	calcNewBallPos = () =>
	{

		let mouveX =  (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
		let mouveY = (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)

		if (this.dirBall > 0 &&  this.posBallY  - this.ballSize <= 0)
		{
			this.dirBall *= -1
			mouveX =  (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
			mouveY =  (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)

			this.posBallX += mouveX
			this.posBallY -= mouveY
			return 7
		}

		if (this.dirBall < 0 && this.posBallY  + this.ballSize >= this.windowHeight)
		{
			this.dirBall *= -1
			mouveX =  (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
			mouveY =  (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)

			this.posBallX += mouveX
			this.posBallY -= mouveY
			return 7
		}
		else if (this.posBallX < 0)
		{
			this.player2.points += 1
			if (this.player2.points === this.pointLimit)
				return 44
			return -1
		}

		if (this.posBallX > this.windowWidth)
		{
			this.player1.points += 1
			if (this.player1.points === this.pointLimit)
				return 44
			return 1
		}

		const ballTouchPaddle1 = this.isballTouchPaddle(this.posBallX, this.posBallY,this.paddlePosX, this.player1.paddlePosY)
		const ballTouchPaddle2 = this.isballTouchPaddle(this.posBallX, this.posBallY,this.player2.paddlePosX, this.player2.paddlePosY)

		if (!ballTouchPaddle1 && !ballTouchPaddle2)
		{
			this.posBallX += mouveX
			this.posBallY -= mouveY
			return 0

		}
		else if ((this.dirBall >= 90 || this.dirBall <= -90)
			&& (ballTouchPaddle1 === 2))
		{
			this.dirBall = this.calcBallAngle(this.player1.paddlePosY)

			mouveX = (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
			mouveY = (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)
		}
		else if (!(this.dirBall >= 90 || this.dirBall <= -90)
			&& (ballTouchPaddle2 === 2))
		{
			const angle = this.calcBallAngle(this.player2.paddlePosY)
			if (angle> 0)
				this.dirBall = 180 - angle
			else
				this.dirBall = -180 -angle

			mouveX = (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
			mouveY = (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)
		}
		else if (ballTouchPaddle1)
		{
			if (ballTouchPaddle1 === 3)
			{
				this.posBallY = this.player1.paddlePosY + this.paddleHeigt + this.ballSize
				if (this.dirBall > 0)
					this.dirBall *= -1
			}
			else if (ballTouchPaddle1 === 4)
			{
				this.posBallY = this.player1.paddlePosY - this.ballSize
				if (this.dirBall < 0)
					this.dirBall *= -1
			}
			mouveX = (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
			mouveY = (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)
		}
		else if (ballTouchPaddle2)
		{
			if (ballTouchPaddle2 === 3)
			{
				this.posBallY = this.player2.paddlePosY + this.paddleHeigt + this.ballSize
				if (this.dirBall > 0)
					this.dirBall *= -1
			}
			else if (ballTouchPaddle2 === 4)
			{
				this.posBallY = this.player2.paddlePosY - this.ballSize
				if (this.dirBall < 0)
					this.dirBall *= -1
			}
			mouveX = (Math.cos((this.dirBall * Math.PI) / 180) * this.ballSpeed)
			mouveY = (Math.sin((this.dirBall * Math.PI)/ 180) * this.ballSpeed)
		}

		this.posBallX += mouveX
		this.posBallY -= mouveY

		return 7
	}

	async endGame(winner: PlayerStatus, gaveUp?: e_match_player)
	{
		try
		{
			const winnerProfil = await this.prisma.profil.findUnique({
				where: {id: winner === "player1" ? this.player1.id : this.player2.id},
				select: profilSelect
			})

			const winnerLevelIncr = winnerProfil.stats.xp + 100 >=  50 + (30 * (winnerProfil.stats.level )) ? 1 : 0
			const winnerXp = winnerLevelIncr ? (winnerProfil.stats.xp + 100) - (50 + (30 * (winnerProfil.stats.level))) : (winnerProfil.stats.xp + 100)


			await this.prisma.profil.update({
				where: {id: winner === "player1" ? this.player1.id : this.player2.id},
				data: {
					stats: {
						update: {
							win : {increment: 1},
							level: {increment: winnerLevelIncr},
							xp: winnerXp,
							percentXp:  100 * winnerXp / (50 + (30 * (winnerProfil.stats.level + winnerLevelIncr)))
						}
					}
				}
			})

			const loserProfil = await this.prisma.profil.findUnique({
				where: {id: winner !== "player1" ? this.player1.id : this.player2.id},
				select: profilSelect
			})
			const loserLevelDecr  = loserProfil.stats.level > 1 ? loserProfil.stats.xp - 50 < 0 ? 1 : 0 : 0
			const loserXp =  loserLevelDecr? (50 + (30 * (loserProfil.stats.level - 1)) + (loserProfil.stats.xp - 50 )) : (loserProfil.stats.xp - 50 )
			await this.prisma.profil.update({
				where: {id: winner !== "player1" ? this.player1.id : this.player2.id},
				data: {
					stats: {
						update: {
							lose : {increment: 1},
							level: {decrement: loserLevelDecr},
							xp: loserXp >= 0 ? loserXp : 0,
							percentXp: loserXp > 0 ? 100 * loserXp / (50 + (30 * (loserProfil.stats.level - loserLevelDecr))) : 0
						},

					}
				}
			})

			let match = await this.prisma.match.update({
				where:{id: this.gameId} ,
				select: matchSelect,
				data: {
					p1Score: this.player1.points,
					p2Score: this.player2.points,
					gaveUp: gaveUp ? gaveUp : undefined
				}})


				const sortPlayer = (a: Profil, b: Profil) =>
				{
					if (a.id === match.player1ProfilId)
						return -1
					return 1
				}
				match = {...match, players: match.players.sort(sortPlayer)}

			return match
		}
		catch (e)
		{
			return null
		}
	}
}
