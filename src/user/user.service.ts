import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "./../prisma.service";
import { messageSelect, profilSelect, userSelect } from "src/lib/select";
import { createUserDTO } from "src/lib/DTOs/user.dto";
import { hashPassword } from "src/lib/utils";
import { AuthService } from "src/auth/auth.service";
import { cp } from "fs";
import { Profil } from "@prisma/client";


@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private authService: AuthService
	) {}

	async findUserById(id: string, password = false)
	{
		try
		{
			return await this.prisma.user.findUniqueOrThrow({
				where: { id },
				select: {...userSelect,
					password,
					conv: {
						include: {
							message: {
								orderBy: {
									timeStamp: 'asc',
								},
								select: messageSelect,
							}
						}
					},
					convInitiator: {
						include: {
							message: {
								orderBy: {
									timeStamp: 'asc',
								},
								select: messageSelect,
							}
						}
					}
				}
			});
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue', HttpStatus.BAD_REQUEST)
		}
	}

	async findAllUser()
	{
		try
		{
			return await this.prisma.user.findMany({select: userSelect});
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}
	}

	async createUser(createUserDTO: createUserDTO)
	{
		if ( (await this.prisma.user.findFirst({
			where: { email: createUserDTO.email }
			})) && (await this.prisma.profil.findFirst({
				where: { userName: createUserDTO.username }})))
		{
			throw new HttpException("L'e-mail est déjà utilisé\nLe nom d'utilisateur est déjà utilisé",
				HttpStatus.CONFLICT);
		}

		try
		{
			const password = await hashPassword(createUserDTO.password);
			const user = await this.prisma.user.create({
				data: {
					email: createUserDTO.email,
					password,
					profil: {
						create: {
						userName: createUserDTO.username,
						avatarId: 1,
						stats: { create: {} },},},},
				select: userSelect,});

			return {...(await this.authService.sendPayload(user.id, user.email, user.tfa, false)),
				user: user,};
		}
		catch (error)
		{
			if (error.code === "P2002" && error.meta.target[0] === "userName")
				throw new HttpException("Le nom d'utilisateur est déjà utilisé",
					HttpStatus.CONFLICT);
			if (error.code === "P2002" && error.meta.target[0] === "email")
				throw new HttpException("L'e-mail est déjà utilisé",
					HttpStatus.CONFLICT);
			else
				throw new HttpException("Une erreur est survenue",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async changeEmail(userId: string, email: string)
	{
		try
		{
			const user = await this.prisma.user.update({
				where: {id: userId},
				data: {
					email: email
				},
				select: userSelect
			})

			return user
		}
		catch (error)
		{
			if (error.code === "P2002" && error.meta.target[0] === "email")
				throw new HttpException("L'e-mail est déjà utilisé",
					HttpStatus.CONFLICT);
			else
				throw new HttpException("Une erreur est survenue",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async changePwd(newPwd: string, userid: string)
	{
		try
		{
			await this.prisma.user.update({
				where: {id: userid},
				data: {password: await hashPassword(newPwd)}
			})

			return (HttpStatus.OK)
		}
		catch (error)
		{
			throw new HttpException("Une erreur est survenue",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	async changeUsername(userId: string, username: string)
	{
		try
		{
			const user = await this.prisma.user.update({
				where: {id: userId},
				data: {
					profil: {
						update: {
							userName: username
						}
					}
				},
				select: userSelect
			})

			return user
		}
		catch (error)
		{
			if (error.code === "P2002" && error.meta.target[0] === "userName")
				throw new HttpException("Le nom d'utilisateur est déjà utilisé",
					HttpStatus.CONFLICT);
			else
				throw new HttpException("Une erreur est survenue",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findProfilByUserId(userId: string) {
		try{
			return await this.prisma.user.findUniqueOrThrow({
				where: { id: userId },
				select: { profil: { select: profilSelect } },});
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}

	}

	async findUserByEmail(email: string) {
			return await this.prisma.user.findUniqueOrThrow({
				where: { email },});
	}

	async findUserByProfilId(profilId: string)
	{
		try
		{
			const profil = await this.prisma.profil.findUniqueOrThrow({
				where: {
					id: profilId }
			});

			return await this.prisma.user.findUniqueOrThrow({
				where: { id: profil.userId }
			})
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}

	}

	async changeGameTheme (userId: string, newTheme: number, color: string)
	{
		try
		{
			const user =  await this.prisma.user.update({
				where: { id: userId },
				data: {
					theme: newTheme,
					themeColor: color
				},
				select: userSelect
			});

			return user
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}
	}

	async findBlockList(userId: string)
	{
		try
		{
			const user =  await this.prisma.user.findUnique({
				where: { id: userId }, select: userSelect});

			const blockList: Profil[] = []

			for (const userId of user.blockList)
			{
				const tmpBlocked = await this.prisma.profil.findUnique({where: {userId}, select: profilSelect})
				if (tmpBlocked)
					blockList.push(tmpBlocked)
			}

			return blockList
		}
		catch
		{
			throw new HttpException('Une erreure est surevenue',
				HttpStatus.BAD_REQUEST)
		}

	}
}

