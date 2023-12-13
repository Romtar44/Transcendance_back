import { IsNotEmpty, IsString } from "class-validator"

export class profilDTO {
	@IsNotEmpty()
	@IsString()
	userName: string
}
