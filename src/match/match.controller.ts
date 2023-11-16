import {
	Controller,
	Get,
	Param,
	HttpException,
	HttpStatus,
	UseGuards,
	Request
} from "@nestjs/common"
import { MyAuthGuard } from "src/auth/guards/jwt.auth.guard"
import { MatchService } from "./match.service"

@Controller("match")
export class MatchController {
	constructor(private readonly matchService: MatchService) {}

	@UseGuards(MyAuthGuard)
	@Get("/getMatch/:id/")
	async getMatch(@Param("id") param: string) {
		const match = await this.matchService.findMatchById(param)

		if (match) return match
		else
			throw new HttpException("Match not found !", HttpStatus.BAD_REQUEST)
	}

	@UseGuards(MyAuthGuard)
	@Get("/getAllMatchUser")
	async getAllMatch(@Request() req: any) {
		return await this.matchService.findAllMatch()
	}

	@UseGuards(MyAuthGuard)
	@Get("/getAllUserMatch/:id")
	async getAllMatchUser(@Request() req: any, @Param("id") id: string) {
		return await this.matchService.findAllMatchUser(req.user.sub, id)
	}
}
