import { HttpException, Injectable } from "@nestjs/common";
import { authenticator } from "otplib";
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import { PrismaService } from "src/prisma.service";
import { AuthService } from "../auth.service";
import { userSelect } from "src/lib/select";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TfaService {
	constructor(private prisma: PrismaService,
		private authService: AuthService,
		private jwtService: JwtService) {}

	public async generateTwoFactorAuthSecret(id: string)
	{
		const user = await this.prisma.user.findUnique({where: {id}, select: userSelect})

		if (user)
		{
			if (user.tfa)
			{
				return {
					msg: 'Already QR generated'
				}
			}
		}

		const secret = authenticator.generateSecret();
		const app_name = process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME
		const otpAuthUrl = authenticator.keyuri(user.email, app_name, secret);

		await this.prisma.user.update({where: {id},
		data: {tfaSecret: secret}})

		return {
			secret,
			otpAuthUrl
		}
	}

	public async qrCodeStreamPipe(stream: Response, otpPathUrl: string) {
		return toFileStream(stream, otpPathUrl);
	}

	public async activationOfTwoFa(id: string, status: boolean) {
		return await this.prisma.user.update({where: {id},
			data: {tfa: status}});
	}

	public async verifyTwoFaCode(code: string, id: string)
	{
		const user = await this.prisma.user.findUnique({where: {id}, select: userSelect})

		return authenticator.verify({
			token: code,
			secret: user.tfaSecret
		});
	}

	async signIn(id: string, isTwoFaAuthenticated: boolean): Promise<{ access_token: string, user: any, tfa: boolean }>
	{
		const user = await this.prisma.user.findUnique({where: {id}, select: userSelect})

		const {password, ...restUser} = user

		return { ...(await this.authService.sendPayload(user.id, user.email, user.tfa, true)), user: restUser, tfa: true};
	}

	async turnOfTwoFa(userId: string)
	{
		try
		{
			const user = await this.prisma.user.update({
				where: {id: userId},
				data: {
					tfa: false,
					tfaSecret: null
				},
				select: userSelect
			})
			return user
		}
		catch
		{
			throw new HttpException("Une erreur est survenue", 500)
		}

	}
}
