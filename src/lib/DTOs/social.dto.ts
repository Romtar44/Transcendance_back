import { IsNotEmpty, IsOptional, IsString, Matches, Validate, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'stringValueValidator' })
export class StringValueValidator implements ValidatorConstraintInterface {
	validate(value: string = ""): boolean {
		if (value !== "PROTECTED" && value !== "PRIVATE" && value !== "PUBLIC")
			return false
		return true
	}
}

export class createChannelDTO {

	@IsString()
	@IsNotEmpty()
	@Validate(StringValueValidator)
	type: string

	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9._-áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]{1,18}$/)
	channelName: string

	@IsOptional()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
	password: string
}

export class manageChannelDTO {

	@IsString()
	@IsNotEmpty()
	channelId: string
}

export class manageUserDTO {

	@IsString()
	@IsNotEmpty()
	userId: string
}

export class protectedChannelApplicationDTO {

	@IsString()
	@IsNotEmpty()
	channelId: string

	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
	password: string
}

export class manageUserChannelDTO {

	@IsString()
	@IsNotEmpty()
	userId: string

	@IsString()
	@IsNotEmpty()
	channelId: string
}
