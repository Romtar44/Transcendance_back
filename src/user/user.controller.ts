import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  HttpException,
  HttpStatus,
  Body,
  UseGuards,
  Request,
  Res
} from "@nestjs/common";
import { Response } from "express";
import { changeEmailDTO, changeThemeDTO, changeUsenameDTO, createUserDTO } from "src/lib/DTOs/user.dto";
import { UserService } from "./user.service";
import { MyAuthGuard } from "src/auth/guards/jwt.auth.guard";
import { comparePassword } from "src/lib/utils";
import { changePwdDTO } from "src/lib/DTOs/auth.dto";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@UseGuards(MyAuthGuard)
	@Get("/userBySession")
	async getUserBySession(@Request() req: any)
	{
		const user = await this.userService.findUserById(req.user.sub)
		user.profil.status = "ONLINE"

		return {user: user}
	}


	@UseGuards(MyAuthGuard)
	@Post("/checkpwd")
	async checkPwd(@Body() body: {oldPwd: string}, @Request() req: any)
	{
		const user = await this.userService.findUserById(req.user.sub, true)
		const {oldPwd} = body

		const pwdMatch = await comparePassword(oldPwd, user.password)

		if (!pwdMatch)
			return (false)

		return (true)
	}

	@UseGuards(MyAuthGuard)
	@Post("/changepwd")
	async changePwd(@Body() changePwdDTO: changePwdDTO, @Request() req: any) {

		const {oldPassword, password} = changePwdDTO

		const user = await this.userService.findUserById(req.user.sub, true)

		const pwdMatch = await comparePassword(oldPassword, user.password)

		if (!pwdMatch)
				throw new HttpException( "Mot de passe incorect !", HttpStatus.CONFLICT)


		return await this.userService.changePwd(password, req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Get("/getAllUser")
	async getAllUser() {
		return await this.userService.findAllUser();
	}

	@UseGuards(MyAuthGuard)
	@Get("/getProfilByUserId")
	async getProfilByUserId()
	{
		try
		{
			return await this.userService.findProfilByUserId(
				"a542605b-3b62-4c33-9759-64ccc9128139");
		}
		catch
		{
			throw new HttpException("Profil not found !",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	@Get("/getUserByEmail/:email")
	async getUserByEmail(@Param("email") param: string)
	{
		try
		{
			const user = await this.userService.findUserByEmail(param);
			return user;
		}
		catch (error)
		{
			if (error.code === "P2025")
				throw new HttpException("Email inconnu !",
					HttpStatus.NOT_FOUND);
			throw new HttpException("Une erreur est survenue !",
				HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	@Put("/newUser")
	async newUser(@Body() createUserDTO: createUserDTO, @Res() res: Response)
	{
		try
		{
			const response = await this.userService.createUser(createUserDTO);
			response.user.profil.status = "ONLINE"
			res.cookie("access_token", response.access_token, {
				domain: `${process.env.DOMAIN}`,
				httpOnly: false,
				secure: false,
				sameSite: "lax",
				maxAge: 7200 * 1000})
				.send(response);
		}
		catch (error)
		{
			throw error;
		}
	}

	@UseGuards(MyAuthGuard)
	@Post("/changeGametheme")
	async changeTheme(@Body() body: changeThemeDTO,  @Request() req: any) {
			return await this.userService.changeGameTheme(req.user.sub, body.theme, body.color)
	}


	@UseGuards(MyAuthGuard)
	@Post("/changeUsername")
	async changeUsername(@Body() body: changeUsenameDTO,  @Request() req: any) {
		return await this.userService.changeUsername(req.user.sub, body.username)
	}

	@UseGuards(MyAuthGuard)
	@Post("/changeEmail")
	async changeEmail(@Body() body: changeEmailDTO,  @Request() req: any) {
		return await this.userService.changeEmail(req.user.sub, body.email)
	}

	@UseGuards(MyAuthGuard)
	@Get('/getBlockList')
	async getBlockList(@Request() req: any) {
		return await this.userService.findBlockList(req.user.sub)
	}
}
