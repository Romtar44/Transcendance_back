import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Friend, Profil, User } from '@prisma/client';
import { FriendGatewayService } from 'src/gateways/events.gateway';
import { profilSelect, userSelect } from 'src/lib/select';
import { PrismaService } from 'src/prisma.service';
import { ConversationService } from './conversation/conversation.service';


@Injectable()
export class SocialService {
	constructor(private prisma: PrismaService,
		private friendGatewayService: FriendGatewayService,
		private conversationService: ConversationService,) {}


	async sortByStatus (profil1: Profil, profil2: Profil)
	{
		return profil1.userName < profil1.userName
	}

	async findProfilsFromFriendList(userId: string)
	{
		try
		{
			const friendList = await this.findFriendList(userId)
			const profilList: Profil[] = []

			for (const friend of friendList)
			{
				const tmpProfil = await this.prisma.profil.findUnique({where: {userId: friend.friendUserId}, select: profilSelect})
				if (tmpProfil)
				{

					profilList.push(tmpProfil)
				}
			}

			return profilList
		}
		catch
		{
			throw new HttpException("Une erreur est survenue !",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findFriendList(userId: string)
	{
		const user = await this.prisma.user.findUnique(
			{where: {id: userId}, select: userSelect})
		return user.friendList
	}


	isBlocked(blockList: string[], blockedId: string): boolean
	{
		if (blockList.includes(blockedId))
			return (true)
		return (false)
	}

	isFriend(friendList: Friend[], friendId: string): boolean
	{
		if (friendList.find((friend) => friend.friendUserId === friendId && friend.accepted === true))
			return (true)
		return (false)
	}


	async acceptFriend(userId: string, newFriendId: string, user?: User)
	{
		if (!user)
			user = await this.prisma.user.findUniqueOrThrow({where: {id: userId}, select: userSelect})

		await this.removeFromPending(user, newFriendId)

		await this.prisma.friend.update({
			where: {ids: {userId: newFriendId, friendUserId: userId}},
			data: {accepted: true}
		})

		this.friendGatewayService.updateFriendList(newFriendId)

		const newFriend = await this.prisma.friend.create( {data: {friendUserId: newFriendId, accepted: true, userId}})
		return newFriend
	}


	async addFriend(userId: string, newFriendId: string)
	{
		try
		{
			const user = await this.prisma.user.findUnique({where: {id: userId}, select: userSelect})

			if (this.isBlocked(user.blockList, newFriendId))
				throw new HttpException("Vous avez bloqué cet utilisateur !",
					HttpStatus.CONFLICT);

			if (this.isFriend(user.friendList, newFriendId))
				throw new HttpException("Vous êtes déjà amis !",
					HttpStatus.NOT_ACCEPTABLE);

			const userFriend = await this.prisma.user.findUnique({where: {id: newFriendId}, select: userSelect})

			if (this.isPendingFriend(userFriend.pendingList, userId))
				throw new HttpException("Vous êtes êtes en attente d'ajout. Veuillez attendre que votre demande soit acceptée !",
					HttpStatus.NOT_ACCEPTABLE);

			if (this.isBlocked(userFriend.blockList, userId))
				throw new HttpException("Cet utilisateur vous a bloqué !",
					HttpStatus.CONFLICT);

			if (this.isPendingFriend(user.pendingList, newFriendId))
				return await this.acceptFriend(userId, newFriendId, user)


			userFriend.pendingList.push(userId)
			await this.prisma.user.update({where: {id: newFriendId},
				data: {pendingList: userFriend.pendingList}})

			const newFriend = await this.prisma.friend.create( {data: {friendUserId: newFriendId, accepted: false, userId}})
			this.friendGatewayService.updateFriendList(newFriendId)

			return newFriend
		}
		catch (error)
		{
			throw error;
		}
	}

	async removeFriendFromList(userId: string, removeId: string)
	{
		await this.prisma.friend.delete({ where: { ids: { userId, friendUserId: removeId } }})
	}

	isPendingFriend(pendingList: string[], pendingId: string): boolean
	{
		if (pendingList.includes(pendingId))
			return (true)
		return (false)
	}

	async removeFromPending(user: User, friendId: string)
	{
		const newpend = user.pendingList.filter((elem) => elem !== friendId)
		await this.prisma.user.update({
			where: { id: user.id }, data: { pendingList: newpend}})
	}

	async removeSelf(userId: string, removeId: string)
	{
		const removedUser = await this.prisma.user.findUnique({ where: { id: removeId}, select: userSelect})

		if (this.isPendingFriend(removedUser.pendingList, userId))
		{
			await this.removeFromPending(removedUser, userId)
			this.friendGatewayService.updateFriendList(removeId)
		}
		else
		{
			await this.removeFriendFromList(removeId, userId)
			this.friendGatewayService.updateFriendList(removeId)
		}
	}

	async removeFriend(userId: string, removeId: string)
	{
		try
		{
			this.removeSelf(userId, removeId)

			this.conversationService.deleteConv(userId, removeId)

			return await this.removeFriendFromList(userId, removeId)
		}
		catch (error)
		{
			throw error
		}
	}

	async blockUser(userId: string, blockId: string)
	{
		try {
			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})

			if (this.isFriend(user.friendList, blockId))
			{
				await this.removeFriend(userId, blockId)
			}

			const newBlockList = user.blockList
			newBlockList.push(blockId)
			const ret = await this.prisma.user.update({
				where: {id: userId}, data: {blockList: newBlockList}
			})
			this.friendGatewayService.updateFriendList(blockId)

			return ret
		}
		catch {
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}
	}



	async unblockUser(userId: string, unblockId: string)
	{
		try {
			const user = await this.prisma.user.findUnique({
				where: {id: userId}, select: userSelect
			})


			const newBlockList = user.blockList.filter((id) => id !== unblockId)

			const ret = await this.prisma.user.update({
				where: {id: userId}, data: {blockList: newBlockList}
			})

			return ret
		}
		catch {
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}
	}
}
