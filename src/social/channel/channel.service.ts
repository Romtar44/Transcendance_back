import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common"
import { PrismaService } from "src/prisma.service"
import { channelSelect, messageSelect, profilSelect, userSelect } from "src/lib/select"
import { createChannelDTO } from "src/lib/DTOs/social.dto"
import { comparePassword, hashPassword } from "src/lib/utils"
import { Channel, Message, User } from "@prisma/client"
import { ChannelGatewayService, FriendGatewayService } from "src/gateways/events.gateway"
import { MessageService } from "../message/message.service"
import { WsException } from "@nestjs/websockets"

@Injectable()
export class ChannelService {
	constructor(private prisma: PrismaService,
		@Inject(forwardRef(() => ChannelGatewayService))
		private channelGatewayService: ChannelGatewayService,
		private messageService: MessageService,
		private friendGatewayService: FriendGatewayService) {}

	async getAllUsersChannels(userId: string)
	{
		try
		{
			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect})

			const channelsId = user.channels
			const channels: Channel[] = []


			for (const id of channelsId)
			{
				const convMessages = await this.findAllMessages(user.id, id)
				const channel = await this.prisma.channel.findUnique({where: {id}, select:channelSelect})
				channel.conv = convMessages
				channels.push(channel)
			}


			return (channels)
		}
		catch (error)
		{
			throw new HttpException('Une erreur est survenue',
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async findChannel(channelId: string)
	{
		try
		{
			return await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})
		}
		catch (error)
		{
			throw new HttpException('Une erreur est survenue',
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async findAllMessages(userId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId},
				select: { ...channelSelect,
						conv: {
							orderBy: {
								timeStamp: "asc"
							},
							select: messageSelect
						}
				}
			})

			if (!channel.memberId.includes(userId))
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			let messageList: Message[] = []

			channel.conv.forEach((message) => {
				if (!user.blockList.includes(message.senderId))
					messageList.push(message)
			})
			return (messageList)
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async addMessage(senderId: string, channelId: string, message: string)
	{
		try
		{

			const channel =  await this.prisma.channel.findUniqueOrThrow(
				{where: {id: channelId},
				select:{memberId: true, mutedList: true}
			})


			if (!channel.memberId.includes(senderId) || channel.mutedList.includes(senderId))
				return


			const newMessage = await this.messageService.newMessageInChannel(message, senderId, channelId)


			return newMessage;
		}
		catch(error)
		{
			throw new WsException("Error sending message !")
		}
	}

	async findAddableChannels(userId: string)
	{
		try
		{
			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect})

			const userChannel = await this.getAllUsersChannels(userId)
			const channels = await this.prisma.channel.findMany()

			let ret = []
			channels.forEach((channel) => {
				if (channel && !userChannel.find((chan) => chan.id === channel.id) &&
					!channel.banList.includes(userId)
					&& (channel.status !== "PRIVATE" || channel.invitedList.includes(user.id)))
					ret.push(channel)
			})

			return ret
		}
		catch (error)
		{
			throw new HttpException('Une erreur est survenue',
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}

	async createChannel(channelDTO: createChannelDTO, userId: string)
	{
		if (await this.prisma.channel.findUnique({ where: { channelName: channelDTO.channelName}}))
			throw new HttpException("Le nom du salon est déjà utilisé",
				HttpStatus.CONFLICT);
		try
		{
			let password = ""
			if (channelDTO.type === "PROTECTED")
				password = await hashPassword(channelDTO.password)

			const adminId: string[] = []
			adminId.push(userId)

			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			const channel = await this.prisma.channel.create({
				data: {
					channelName: channelDTO.channelName,
					ownerId: userId,
					adminId,
					memberId: adminId,
					status: channelDTO.type,
					password,
				}
			})

			const newChannel = user.channels
			newChannel.push(channel.id)

			await this.prisma.user.update({
				where: {id: userId},
				data: {channels: newChannel},
			})

			return newChannel
		}
		catch (error)
		{
			if (error.code === "P2002" && error.meta.target[0] === "channelName")
				throw new HttpException("Le nom du salon est déjà utilisé",
					HttpStatus.CONFLICT);
			else
				throw new HttpException("Une erreur est survenue",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async addToChannel(channel: Channel, user: User, invited: boolean)
	{
		try
		{
			if (invited)
			{
				const newinvitedList = channel.invitedList.filter((id) => id !== user.id)
				await this.prisma.channel.update({
					where: {id:channel.id},
					data: {invitedList: newinvitedList}
				})

				const newPendingChannelList = user.channelPendingList.filter((id) => id !== channel.id)
				await this.prisma.user.update({
					where: {id: user.id},
					data: {channelPendingList: newPendingChannelList}
				})
			}

			const newMemberIdList = channel.memberId
			newMemberIdList.push(user.id)
			await this.prisma.channel.update({
				where: {id: channel.id},
				data: {memberId: newMemberIdList}
			})

			const newChannelIdList = user.channels
			newChannelIdList.push(channel.id)
			const updatedUser = await this.prisma.user.update({
				where: {id: user.id},
				data: {channels: newChannelIdList},
				select: userSelect
			})

			if (invited)
				this.friendGatewayService.updateFriendList(user.id)
			this.channelGatewayService.updateChannelList(channel.id)
			await this.prisma.message.create({
                data: {
                    senderId: "bot",
                    content: `${updatedUser.profil.userName} a rejoint le salon`,
                    channelId: channel.id
                }
            })
			return newChannelIdList
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async protectedChannelApplicationManager(userId: string, channelId: string, password: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!comparePassword(password, channel.password))
				throw new HttpException("Mot de passe erroné",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			return await this.addToChannel(channel, user, false)
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async channelApplicationManager(userId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			if (channel.banList.includes(userId))
				throw new HttpException("Vous êtes banni de ce salon",
					HttpStatus.CONFLICT);

			if (channel.invitedList.includes(userId))
				return await this.addToChannel(channel, user, true)

			if (channel.status === "PRIVATE")
				throw new HttpException("Bien essayé",
					HttpStatus.CONFLICT);

			if (channel.status === "PROTECTED")
				return {message: "PROTECTED", channelId}

			return await this.addToChannel(channel, user, false)

		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async destroyChannel(channelId: string, channel?: Channel, ownerId?: string)
	{
		try
		{
			if (!channel)
			{
				channel = await this.prisma.channel.findUniqueOrThrow({
					where: {id: channelId}, select: channelSelect
				})
			}

			if (ownerId && channel.ownerId !== ownerId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR)


			let member: User
			let newChannelList = []
			for (const id of channel.memberId)
			{
				 member = await this.prisma.user.findUnique({
					where: {id}, select: userSelect
				})

				newChannelList = member.channels.filter((chanId) => chanId !== channelId)
				await this.prisma.user.update({
					where: {id: member.id},
					data: {channels: newChannelList}
				})
			}

			const ret = await this.prisma.channel.delete({where: {id:channelId}})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findAddableFriends(userId: string, channelId: string)
	{
		try
		{
			const user = await this.prisma.user.findUnique({
				where: {id:userId}, select: userSelect
			})

			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			let addableFriends = []
			user.friendList.forEach((friend) => {
				if (!channel.memberId.includes(friend.userId))
					addableFriends.push(friend.id)
			})

			return (addableFriends)
		}
		catch (error)
		{

			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async inviteFriend(channelId: string, inviterId: string, invitedId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!channel.memberId.includes(inviterId) || channel.banList.includes(invitedId))
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const newChannelInvitedList = channel.invitedList
			newChannelInvitedList.push(invitedId)

			await this.prisma.channel.update({
				where: {id: channelId},
				data: {invitedList: newChannelInvitedList}
			})

			const user = await this.prisma.user.findUnique({
				where: {id: invitedId}, select: userSelect
			})

			const newChannelPendingList = user.channelPendingList
			newChannelPendingList.push(channelId)

			const ret = await this.prisma.user.update({
				where: {id: invitedId},
				data: {channelPendingList: newChannelPendingList}
			})

			this.channelGatewayService.updateChannelList(channelId)
			this.friendGatewayService.updateFriendList(invitedId)

			return ret
		}
		catch (error)
		{

			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async kickUser(adminId: string, userId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!channel.adminId.includes(adminId) || (channel.adminId.includes(userId) && adminId !== channel.ownerId) || userId === channel.ownerId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const kicked = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			await this.prisma.message.create({
				data: {
					senderId: "bot",
					content: `${kicked.profil.userName} s'est fais expulser du salon`,
					channelId
				}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return await this.leaveChannel(channelId, userId)
		}
		catch (error)
		{

			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async transmitOwnership(oldOwnerId: string, newOwnerId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (oldOwnerId !== channel.ownerId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			let newAdminList = channel.adminId
			if (!channel.adminId.find((id) => id === newOwnerId))
			{
				newAdminList.push(newOwnerId)
			}

			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {ownerId: newOwnerId, adminId: newAdminList}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{

			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async addAdmin(ownerId: string, newAdmin: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (channel.adminId.includes(newAdmin))
				return channel

			if (ownerId !== channel.ownerId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);
			if (channel.adminId.includes(newAdmin))
				throw new HttpException("Cet utilisateur est déjà un administrateur",
					HttpStatus.CONFLICT);


			const newAdminList = channel.adminId
			newAdminList.push(newAdmin)

			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {adminId: newAdminList}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async removeAdmin(ownerId: string, adminToRemove: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!channel.adminId.includes(adminToRemove))
				return channel

			if (ownerId !== channel.ownerId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const newAdminList = channel.adminId.filter((admin) => admin !== adminToRemove)

			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {adminId: newAdminList}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async unMuteUser(adminId: string, mutedId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!channel.adminId.includes(adminId))
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const newMutedList = channel.mutedList.filter((muted) => muted !== mutedId)
			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {mutedList: newMutedList}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async muteUser(adminId: string, mutedId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!channel.adminId.includes(adminId) || (channel.adminId.includes(mutedId) && adminId !== channel.ownerId) || mutedId === channel.ownerId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);


			const newMutedList = channel.mutedList
			newMutedList.push(mutedId)


			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {mutedList: newMutedList}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async banUser(adminId: string, bannedId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if ((!channel.adminId.includes(adminId) || (channel.adminId.includes(bannedId) && adminId !== channel.ownerId) || bannedId === channel.ownerId) && channel.ownerId !== adminId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			await this.leaveChannel(channelId, bannedId)


			const newChannel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			const newBanList = newChannel.banList
			newBanList.push(bannedId)

			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {banList: newBanList}
			})

			const banned = await this.prisma.user.findUnique({
				where: {id:bannedId}, select: userSelect
			})

			await this.prisma.message.create({
				data: {
					senderId: "bot",
					content: `${banned.profil.userName} s'est fais bannir du salon`,
					channelId
				}
			})

			this.channelGatewayService.updateChannelList(newChannel.id)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async unbanUser(adminId: string, unbannedId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if ((!channel.adminId.includes(adminId) || channel.adminId.includes(unbannedId) || unbannedId === channel.ownerId) && channel.ownerId !== adminId)
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			const newBanList = channel.banList.filter((banned) => banned !== unbannedId)

			const ret = await this.prisma.channel.update({
				where: {id: channelId},
				data: {banList: newBanList}
			})

			this.channelGatewayService.updateChannelList(channel.id)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async leaveChannel(channelId: string, userId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			if (channel.ownerId === userId || channel.memberId.length <= 1)
			{
				return await this.destroyChannel(channelId, channel)
			}

			if (channel.adminId.includes(userId))
			{
				const newAdminList = channel.adminId.filter((id) => id !== userId)
					await this.prisma.channel.update({
					where: {id: channelId},
					data: {adminId: newAdminList}
				})
			}

			const newMemberList = channel.memberId.filter((id) => id !== userId)
			await this.prisma.channel.update({
				where: {id: channelId},
				data: {memberId: newMemberList}
			})

			const newChannelList = user.channels.filter((id) => id !== channelId)



			await this.prisma.message.deleteMany({
				where: {senderId: userId, channelId}
			})

			const ret = await this.prisma.user.update({
				where: {id: userId},
				data: {channels: newChannelList}
			})

			this.channelGatewayService.updateChannelList(channelId)

			return ret
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findAllProfil(userId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			let profilList = []

			for (const member of channel.memberId)
			{
				if (member !== userId)
				{
					profilList.push(await this.prisma.profil.findUnique({
						where: {userId: member}, select: profilSelect}))
				}
			}

			return profilList
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async findAllBannedProfil(userId: string, channelId: string)
	{
		try
		{
			const channel = await this.prisma.channel.findUnique({
				where: {id: channelId}, select: channelSelect
			})

			if (!channel.adminId.includes(userId))
				throw new HttpException("Vous n'êtes pas autorisé à réaliser ce genre d'action",
					HttpStatus.INTERNAL_SERVER_ERROR);

			let profilList = []

			for (const banned of channel.banList)
			{
				if (banned !== userId)
				{
					profilList.push(await this.prisma.profil.findUnique({
						where: {userId: banned}, select: profilSelect}))
				}
			}

			return profilList
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
