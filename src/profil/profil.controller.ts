import {
	Controller,
	Get,
	Put,
	Request,
	Body,
	Param,
	HttpException,
	HttpStatus,
	UseInterceptors,
	FileTypeValidator,
	MaxFileSizeValidator,
	ParseFilePipe,
	UploadedFile,
	UseGuards,
} from "@nestjs/common"
import { ProfilService } from "./profil.service"
import { profilDTO } from "src/lib/DTOs/profil.dto"
import { FileInterceptor } from "@nestjs/platform-express"
import { MyAuthGuard } from "src/auth/guards/jwt.auth.guard"

@Controller("profil")
export class ProfilController {
	constructor(private readonly profilService: ProfilService) {}

	@UseGuards(MyAuthGuard)
	@Get("/getProfil/:id")
	async getProfil(@Param("id") param: string, @Request() req: any) {
		return await this.profilService.findProfilById(param)
	}

	@UseGuards(MyAuthGuard)
	@Get("/getProfilAddable")
	async getProfilAddable(@Request() req: any) {
		return await this.profilService.findAddableProfils(req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Put("/newProfil")
	@UseInterceptors(FileInterceptor('avatar'))
	async newProfil(@Body() profilDTO: profilDTO, @Request() req: any,
	 @UploadedFile( new ParseFilePipe({
		validators: [
			new MaxFileSizeValidator({ maxSize: 10000000000000 }),
			new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
		],
		fileIsRequired: false,
			}),)
	file?: Express.Multer.File,)
	{
		try
		{
			return await (this.profilService.createProfil(req.user.sub, profilDTO, file?.buffer))
		}
		catch (error)
		{
			throw new HttpException("Profil creation error !",
				HttpStatus.INTERNAL_SERVER_ERROR)
		}
	}
}
