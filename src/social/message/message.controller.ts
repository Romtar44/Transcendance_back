import {
	Controller,
	Get,
	Param,
	HttpException,
	HttpStatus,
} from "@nestjs/common"
import { MessageService } from "./message.service"

@Controller("message")
export class MessageController {
	constructor(private readonly MessageService: MessageService) {}

	@Get("/getMessage/:id")
	async getMessage(@Param("id") param: string) {
		const message = await this.MessageService.findMessageById(param)

		if (message) return message
		else
			throw new HttpException(
				"Message not found !",
				HttpStatus.BAD_REQUEST
			)
	}

	@Get("getAllMessage/")
	async getAllMessage() {
		return this.MessageService.findAllMessage()
	}
}
