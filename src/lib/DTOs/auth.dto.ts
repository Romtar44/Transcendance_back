import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class authDTO {
	@IsNotEmpty()
	@IsEmail()
	email: string

	@IsNotEmpty()
	@IsString()
	password: string
}

export class changePwdDTO {

	@IsString()
	oldPassword: string

	@IsString()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
	password: string
}

export class TwoFaAuthDto {

	@ApiProperty()
	@IsString()
	code: string
}
