import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-42';
import { PrismaService } from "src/prisma.service";

@Injectable()
export class SchoolStrategy extends PassportStrategy(Strategy, "42") {
	constructor(private prisma: PrismaService) {
	super({
		clientID:  process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		callbackURL: process.env.CALLBACK_URL,
	});

	}

	async validate(
		_accessToken: string,
		_refreshToken: string,
		profile: any,
		done: any)
	{
		const { id, login, email } = profile._json;

		const user = {
		email: email,
		username:login};

		done(null, user);
	}
}
