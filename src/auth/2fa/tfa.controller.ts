import { Body, Controller, Get, HttpException, Post, Req, Res, UnauthorizedException, UseGuards, ValidationPipe } from "@nestjs/common";
import { Response } from 'express';
import { TfaService } from "./tfa.service";
import { MyAuthGuard } from "../guards/jwt.auth.guard";
import { TwoFaAuthDto } from "src/lib/DTOs/auth.dto";
import { JwtTwoFactorGuard } from "../guards/tfa.guard";

@Controller('tfa')
export class TfaController {
	constructor(private readonly tfaService: TfaService) {}


	@UseGuards(MyAuthGuard)
	@UseGuards(JwtTwoFactorGuard)
	@Get('generate-qr')
	async generateQrCode(@Res() response: Response, @Req() req: any)
	{
		const { otpAuthUrl } = await this.tfaService.generateTwoFactorAuthSecret(req.user.sub);
		response.setHeader('content-type','image/png');
		return this.tfaService.qrCodeStreamPipe(response, otpAuthUrl);
	}

	@UseGuards(MyAuthGuard)
	@UseGuards(JwtTwoFactorGuard)
	@Post('turn-on-qr')
	async activationOfTwoFa(@Req() req: any,
		@Body(ValidationPipe) twoFaAuthDto: TwoFaAuthDto, @Res() res: Response )
	{
		const isCodeValid = await this.tfaService.verifyTwoFaCode(twoFaAuthDto.code, req.user.sub);

		if (!isCodeValid) {
			throw new HttpException('Code incorrect', 400);
		}
		await this.tfaService.activationOfTwoFa(req.user.sub, true);
		const response = await this.tfaService.signIn(req.user.sub, true);
		res.cookie("access_token", response.access_token, {
			domain: `${process.env.DOMAIN}`,
			httpOnly: false,
			secure: false,
			sameSite: "lax",
			maxAge: 7200 * 1000,})
		.send(response)
	}

	@Post('authenticate')
	@UseGuards(MyAuthGuard)
	async authenticate(@Req() req: any, @Body(ValidationPipe) twoFaAuthDto: TwoFaAuthDto, @Res() res: Response)
	{
		const isCodeValid = await this.tfaService.verifyTwoFaCode(twoFaAuthDto.code, req.user.sub);
		if (!isCodeValid) {
			throw new UnauthorizedException('Invalid authentication code');
		}
		const response = await this.tfaService.signIn(req.user.sub, true);
		res.cookie("access_token", response.access_token, {
			domain: `${process.env.DOMAIN}`,
			httpOnly: false,
			secure: false,
			sameSite: "lax",
			maxAge: 7200 * 1000,})
		.send(response)
	}

	@Post('turn-of-2fa')
	@UseGuards(MyAuthGuard)
	@UseGuards(JwtTwoFactorGuard)
	async turnOfTwoFa(@Req() req: any)
	{
		return await this.tfaService.turnOfTwoFa(req.user.sub)
	}
}
