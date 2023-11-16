import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { User } from "@prisma/client";
import { Strategy, ExtractJwt } from 'passport-jwt'
import { PrismaService } from "src/prisma.service";
import { JwtPayload } from "../constants";

@Injectable()
export class JwtTwoFaStrategy extends PassportStrategy(Strategy, 'jwt-two-factor')
{
	constructor(private prisma: PrismaService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWTSECRET
		})}

	async validate(payload: JwtPayload): Promise<User>
	{
		const { email } = payload;
		const user = await this.prisma.user.findUnique({where: {email}})

		if (!user) {
			throw new UnauthorizedException()
		}

		if (!user.tfa) {
			return user;
		}

		if (payload.isTfaAuthentificated) {
			return user;
		}
	}
}
