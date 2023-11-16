import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { PrismaService } from "./../prisma.service"
import { userSelect } from "src/lib/select"
import { profilDTO } from "src/lib/DTOs/profil.dto"
import { AvatarService } from "src/avatar/avatar.service"
import { e_log_status } from "@prisma/client"

@Injectable()
export class ProfilService {
	constructor(private prisma: PrismaService, private avatar: AvatarService) {}

	async findProfilById(userId: string)
	{
		try
		{
				const user = await this.prisma.user.findUniqueOrThrow({
					where: {id: userId},
					select: {...userSelect, profil: {
						select: {userName: true, avatarId: true, userId: true}}}})
				const friendProfil =  user.profil

				return friendProfil
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}
	}

	async findAddableProfils(userId: string)
	{
		try
		{
			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			const profilList = await this.prisma.profil.findMany()

			const pendingProfilList = profilList.filter((profil) => user.pendingList.includes(profil.userId))
			const blockedProfilList = profilList.filter((profil) => user.blockList.includes(profil.userId))

			const userList = await this.prisma.user.findMany()
			let unwanted: string[] = []
			userList.forEach((unwantedUser) => {
				if (unwantedUser.blockList.includes(userId))
					unwanted.push(unwantedUser.id)
		})
			const ret = profilList.filter((profil) =>
				profil.userId !== user.id &&
				!unwanted.includes(profil.userId) &&
				!user.friendList.find((friend) => friend.friendUserId === profil.userId) &&
				!pendingProfilList.find((pendingUser) => pendingUser.userId === profil.userId) &&
				!blockedProfilList.find((blockedUser) => blockedUser.userId === profil.userId))


			const retval = pendingProfilList.concat(ret)
			return retval
		}
		catch (error)
		{
			throw new HttpException('Une erreur est survenue',
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async createProfil( userId: string, profilDTO: profilDTO, img?: Buffer)
	{
		try
		{
			let avatarId = 1;
			if (img)
			{
				const newAvatar = await this.avatar.createAvatar(img, userId)
				avatarId = newAvatar.id
			}

			const user = await this.prisma.user.update({
				where: { id: userId },
				data: { profil: { create: { ...profilDTO , avatarId, stats:  { create: {} } } } },
				select: { profil: true}
			})

			return (user.profil)
		}
		catch {
			throw new HttpException('Une erreure est surevenue', HttpStatus.BAD_REQUEST)
		}
	}

	async modifyStatus(status: e_log_status, userId: string)
	{
		try
		{
			return await this.prisma.profil.update({
				where: {userId},
				data: {status}})
		}
		catch (error)
		{
			return ("Failed to change status !")
		}
	}
}
