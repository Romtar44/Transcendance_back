import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
	} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { userSelect } from "src/lib/select";
import { comparePassword } from "src/lib/utils";
import { PrismaService } from "src/prisma.service";
import { JwtPayload } from "./constants";

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService, private prisma: PrismaService) {}

	async sendPayload(userId: string, userEmail: string, tfa: boolean, isTfaAuthentificated: boolean)
	{
		try
		{
			const payload:JwtPayload = { sub: userId, email: userEmail, isTfaEnable: tfa, isTfaAuthentificated: isTfaAuthentificated}

			return { access_token: await this.jwtService.signAsync(payload) }
		}
		catch (error)
		{
			throw error
		}
	}

	async signIn(email: string, pass: string)
	{
		try
		{
			const user = await this.prisma.user.findUnique({
				where: { email },
				select: {...userSelect, password:true}
			})

			if (!user) {
				throw new UnauthorizedException("E-mail inconnu !");
			}

			if (!(await comparePassword(pass, user.password))) {
				throw new UnauthorizedException("Mot de passe incorect !")
			}

			const {password, ...restUser} = user

			if (user.tfa)
				return { ...(await this.sendPayload(user.id, user.email, user.tfa, false)), user: undefined, tfa: true }

			return { ...(await this.sendPayload(user.id, user.email, user.tfa, false)), user: restUser, tfa: false};
		}
		catch (error)
		{
			throw error
		}
	}


	async signInSchool(user)
	{
		try
		{
			if (!user)
				throw new BadRequestException("Unauthenticated")

			const userExists = await this.prisma.user.findUnique({
				where: { email: user.email },
				select: userSelect
			});

			let nUser: User;

			if (!userExists)
			{
				const newUser = await this.prisma.user.create({
					data: {
						email: user.email,
						profil: {
							create: {
								userName: user.username,
								avatarId: 1,
								stats: { create: {} },},},},
					select: userSelect,
				})

				nUser = newUser;
			}
			else
				nUser = userExists;

			return {...(await this.sendPayload(nUser.id, nUser.email, nUser.tfa, false)), user: nUser};
		}
		catch (error)
		{
			throw error
		}
	}
}
