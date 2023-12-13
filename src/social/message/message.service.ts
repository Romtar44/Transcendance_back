import { Injectable } from "@nestjs/common"
import { PrismaService } from "src/prisma.service"
import { messageSelect } from "src/lib/select"

@Injectable()
export class MessageService {
	constructor(private prisma: PrismaService) {}

	async findMessageById(id: string)
	{
		return await this.prisma.message.findUnique({
			where: { id },
			select: messageSelect,
		})
	}

	async findAllMessage()
	{
		return await this.prisma.message.findMany()
	}

	async newMessage(content: string, senderId: string, convId: string, seen = false)
	{
		return await this.prisma.message.create({data: {content, senderId, convId, seen}, select: {...messageSelect}})
	}

	async newMessageInChannel(content: string, senderId: string, channelId: string)
	{
		return await this.prisma.message.create({data: {content, senderId, channelId}})
	}

	async seeMessages(convId : string)
	{
		await this.prisma.message.updateMany({
			where: {convId: convId},
			data: {seen: true}
		})

		return await this.prisma.conversation.findUnique({
			where: {id: convId},
			include: {
				message: {
					orderBy: {
						timeStamp: 'asc',
					},
					select: messageSelect,
				}
			}
		})
	}

}
