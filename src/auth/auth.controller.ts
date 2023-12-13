import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Redirect,
	Req,
	Request,
	Res,
	UseGuards} from "@nestjs/common";
import { MyAuthGuard } from "./guards/jwt.auth.guard";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { authDTO } from "src/lib/DTOs/auth.dto";
import { SchoolAuthGuard } from "./guards/school.guards";
import { JwtTwoFactorGuard } from "./guards/tfa.guard";


@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post("login")
	async signIn(@Body() signInDto: authDTO, @Res() res: Response)
	{
		try
		{
			let response = await this.authService.signIn(
				signInDto.email,
				signInDto.password);
			if (response.user)
				response.user.profil.status = "ONLINE"
			else response = {...response}
			res.cookie("access_token", response.access_token, {
				domain: `${process.env.DOMAIN}`,
				httpOnly: false,
				secure: false,
				sameSite: "lax",
				maxAge: 7200 * 1000,})
			.send(response)
		}
		catch (error) {
			throw error;
		}
	}

	@Get("/issignin")
	@UseGuards(MyAuthGuard)
	@UseGuards(JwtTwoFactorGuard)
	async isSignIn(@Request() req: any) {
		return HttpStatus.ACCEPTED;
	}


	@Get("/isSimpleSignin")
	@UseGuards(MyAuthGuard)
	async isSimpleSignIn(@Request() req: any) {
		return HttpStatus.ACCEPTED;
	}

	@Get("/42")
	@UseGuards(SchoolAuthGuard)
	async oauth() {}

	@Get("/42/callback")
	@UseGuards(SchoolAuthGuard)
	@Redirect(`${process.env.FRONT_URL}`, 301)
	async schoolAuthCallback(@Req() req, @Res() res: Response)
	{
		const ret = await this.authService.signInSchool(req.user);
		const token = ret.access_token


		res.cookie("access_token", token, {
		domain: `${process.env.DOMAIN}`,
		httpOnly: false,
		secure: false,
		sameSite: "lax",
		maxAge: 7200 * 1000,
		})
		.status(200);
		return (ret.user)
	}

	@Get("/logout")
	@UseGuards(MyAuthGuard)
	async logout( @Res() res: Response) {
		res.clearCookie("access_token").sendStatus(200)
	}
}
