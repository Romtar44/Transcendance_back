import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MessageService } from '../message/message.service';
import { WsException } from '@nestjs/websockets';
import { userSelect } from 'src/lib/select';
import { Friend } from '@prisma/client';

@Injectable()
export class ConversationService {
	constructor(private prisma: PrismaService,
		private messageService: MessageService) {}

	async deleteConv(userInitId: string, userId2: string)
	{
		let toDelete = await this.prisma.conversation.findUnique({
			where: { interlocutor: { userInitId, userId2 }}})
		if (toDelete)
		{
			return await this.prisma.conversation.delete({
				where: { interlocutor: { userInitId, userId2 }}})
		}
		else
		{
			toDelete = await this.prisma.conversation.findUnique({
				where: { interlocutor: { userId2, userInitId }}})
			if (toDelete)
			{
				return await this.prisma.conversation.delete({
					where: { interlocutor: { userId2, userInitId }}})
			}
		}
	}

	isFriend(friendList: Friend[], friendId: string): boolean
	{
		if (friendList.find((friend) => friend.friendUserId === friendId && friend.accepted === true))
			return (true)
		return (false)
	}

	async isMessageAllowed(senderId: string, receiverId: string)
	{
		const sender = await this.prisma.user.findUnique({
			where: {id: senderId}, select: userSelect
		})

		if (sender.blockList.includes(receiverId) ||
			!this.isFriend(sender.friendList, receiverId))
		{
			return false
		}

		const receiver = await this.prisma.user.findUnique({
			where: {id: receiverId}, select: userSelect
		})

		if (receiver.blockList.includes(senderId) ||
			!this.isFriend(receiver.friendList, senderId))
		{
			return false
		}

		return true
	}

	async addMessage(senderId: string, receiverId: string, message: string)
	{
		try
		{
			if (!await this.isMessageAllowed(senderId, receiverId))
			{

				return
			}

			let userInitId = senderId
			let userId2 = receiverId

			let conv = await this.prisma.conversation.findUnique({
				where: {interlocutor: {userInitId: senderId, userId2: receiverId}}})

			if (!conv)
			{
				userInitId = receiverId
				userId2 = senderId
			}

			conv = await this.prisma.conversation.upsert({
				where: {
						interlocutor: {userInitId, userId2}},
				update: {},
				create: {userInitId, userId2}
			})


			const newMessage = await this.messageService.newMessage(message, senderId, conv.id)

			return newMessage;
		}
		catch(error)
		{
			throw new WsException("Error sending message !")
		}
	}

}

