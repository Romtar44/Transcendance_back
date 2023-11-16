import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { avatarSelect } from "src/lib/select"
import { PrismaService } from "src/prisma.service"

@Injectable()
export class AvatarService {
	constructor(private prisma: PrismaService) {}

	async findAvatarById(id: number) {

		try
		{
			const avatar = await this.prisma.avatar.findUniqueOrThrow({
				where: { id },
				select: avatarSelect,
			})
			return avatar.img
		}
		catch (error)
		{
			throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async findAllAvatar() {
		return await this.prisma.avatar.findMany()
	}

	async findPpById(id: number) {
		const avatar = this.prisma.avatar.findUnique({
			where: { id },
			select: { img: true },
		})
		return (await avatar).img
	}

	async createAvatar(buff: Buffer, userId: string) {
		try{
			const avatar = await this.prisma.avatar.create({ data: { img: buff}})
			const oldProfil = await this.prisma.profil.findUniqueOrThrow({where:{userId}})
			 await this.prisma.profil.update({
				where:{userId},
				data:{avatarId:avatar.id}
			})
			if (oldProfil.avatarId !== 1)
				this.prisma.avatar.delete({where: {id: oldProfil.avatarId}})
			return (avatar);
		}
		catch{
			throw new HttpException("Une erreure est survenue", 500)
		}

	}
}
