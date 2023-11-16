import {
	Controller,
	Get,
	Post,
	Param,
	HttpException,
	HttpStatus,
	UseInterceptors,
	UploadedFile,
	ParseFilePipe,
	FileTypeValidator,
	MaxFileSizeValidator,
	UseGuards,
	Res,
	Request,
	ParseIntPipe
} from "@nestjs/common"
import { AvatarService } from "./avatar.service"
import { FileInterceptor } from "@nestjs/platform-express"
import { MyAuthGuard } from "src/auth/guards/jwt.auth.guard"
import { Response  } from 'express'

@Controller("avatar")
export class AvatarController {
	constructor(private readonly avatarService: AvatarService) {}

	@Get("/getAvatar/:id")
	@UseGuards(MyAuthGuard)
	async getAvatar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
		const avatar = await this.avatarService.findAvatarById(id)
		res.writeHead(200, {'Content-Type': 'image/png'});
		res.end(avatar)
	}


	@Get("/getAvatar/:id/pp")
	async getPp(@Param("id") param: number) {
		const pp = await this.avatarService.findPpById(param)

		if (pp)
			return pp
		else
			throw new HttpException("Pp not found !",
				HttpStatus.BAD_REQUEST)
	}

	@Post("/createAvatar/")
	@UseGuards(MyAuthGuard)
	@UseInterceptors(FileInterceptor('file'))
	async newAvatar(@UploadedFile( new ParseFilePipe({
			validators: [
				new MaxFileSizeValidator({ maxSize: 10000000000000 }),
				new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
			],
		}),)
		file: Express.Multer.File,
		@Request() req: any)
	{
		try
		{
			return await (this.avatarService.createAvatar(file.buffer, req.user.sub))
		}
		catch
		{
			throw new HttpException("Uploading error !",
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}
}
