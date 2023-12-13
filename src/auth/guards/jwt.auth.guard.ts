import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "../constants";
import { Request } from "express";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class MyAuthGuard implements CanActivate {
	constructor(private jwtService: JwtService, private prisma : PrismaService ) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractJwtFromCookie(request);

		if (!token) {
			throw new UnauthorizedException();
		}

		try
		{
			const payload = await this.jwtService.verifyAsync(token, {
			secret: jwtConstants.secret});


			if (!payload || !payload.sub)
				throw ("no user")

			const user = await this.prisma.user.findUniqueOrThrow({where: {id: payload.sub}})
			request["user"] = payload;

		}
		catch
		{
			throw new UnauthorizedException();
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? [];
		return type === "Bearer" ? token : undefined;
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
