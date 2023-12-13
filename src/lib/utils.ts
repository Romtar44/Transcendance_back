import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Socket } from 'socket.io';
import { jwtConstants } from 'src/auth/constants';
import { PrismaService } from 'src/prisma.service';



export type GameVar= {
	userId: string,
	paddlePosY: string
}


export class Debounce {
	timeoutID: unknown

	execute = (fn: () => void, ms: number) =>
	{
		if (typeof this.timeoutID === "number")
			clearTimeout(this.timeoutID)
		this.timeoutID = setTimeout(() => fn(), ms)
	}
}


export async function hashPassword(plaintextPassword: string) {
	return await bcrypt.hash(plaintextPassword, 10);
}

export async function comparePassword(plaintextPassword: string, hash: string) {
	return await bcrypt.compare(plaintextPassword, hash);
}

export async function verifyToken(socket: Socket, jwtService: JwtService, prisma: PrismaService) {
	try{
		const token = socket.handshake.auth.access_token
		if (!token)
			return null
		const userPayload = await jwtService.verifyAsync(token, {
				secret: jwtConstants.secret});

		if (!userPayload || !userPayload.sub)
			return null

		const u = await prisma.user.findUniqueOrThrow({where: {id: userPayload.sub}})

		return userPayload
	}
	catch {
		return null
	}
}










