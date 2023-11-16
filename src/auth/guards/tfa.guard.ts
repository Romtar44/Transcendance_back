import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "../constants";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class  JwtTwoFactorGuard implements CanActivate {
	constructor(private jwtService: JwtService, private prisma : PrismaService ) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractJwtFromCookie(request);


		try
		{
			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtConstants.secret});

			const user = await this.prisma.user.findUniqueOrThrow({where: {id: payload.sub}})

			if (user.tfa && !payload.isTfaAuthentificated) {
				throw new UnauthorizedException();
			}

		}
		catch
		{
			throw new UnauthorizedException();
		}
		return true;
	}

	private extractJwtFromCookie = (req : any) =>
	{
		let token = null;
		if (req && req.cookies )
		{
			token = req.cookies["access_token"]
		}
		return token
	};
}
