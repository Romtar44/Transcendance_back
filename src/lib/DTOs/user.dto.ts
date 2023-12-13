import { IsEmail,Min, Max, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator"

export class userDTO {
	@IsOptional()
	@IsEmail()
	email: string

	@IsOptional()
	@IsString()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
	password: string
}

export class createUserDTO {
	@IsNotEmpty()
	@IsEmail()
	email: string

	@IsNotEmpty()
	@IsString()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
	password: string

	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9._-áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]{1,18}$/)
	username: string
}


export class changeThemeDTO {
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Max(6)
	theme: number

	@IsNotEmpty()
	@IsString()
	color: string

}


export class changeUsenameDTO {
	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9._-áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]{1,18}$/)
	username: string
}

export class changeEmailDTO {
	@IsNotEmpty()
	@IsEmail()
	email: string
}