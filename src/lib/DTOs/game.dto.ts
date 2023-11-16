import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsNumber} from "class-validator"


export class defyDTO {

	@IsNotEmpty()
	@IsString()
	adversaireId: string

	@IsOptional()
	@IsBoolean()
	custom: boolean

	@IsOptional()
	@IsNumber()
	@Min(10)
	@Max(80)
	paddleHeight: number


	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(5)
	ballSpeed: number

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(5)
	ballAcceleration: number

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	pointLimit: number
}



export class startGameDTO {

	@IsNotEmpty()
	@IsString()
	gameId: string

	@IsOptional()
	@IsBoolean()
	custom: boolean

	@IsOptional()
	@IsNumber()
	@Min(10)
	@Max(80)
	paddleHeight: number

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(5)
	ballSpeed: number

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(5)
	ballAcceleration: number

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(10)
	ballSize: number

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	pointLimit: number
}
