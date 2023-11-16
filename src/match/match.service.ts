import { HttpException, Injectable } from "@nestjs/common"
import { matchSelect } from "src/lib/select"
import { PrismaService } from "src/prisma.service"
import { SocialService } from "src/social/social.service"

@Injectable()
export class MatchService {
	constructor(private prisma: PrismaService) {}

	async findMatchById(id: string) {
		return await this.prisma.match.findUnique({
			where: { id },
			select: matchSelect,
		})
	}

	async findAllMatch() {
		return await this.prisma.match.findMany()
	}

	async findAllMatchUser(userId: string, getHistoryUserId: string) {
		try {

			const user = await this.prisma.user.findUnique({where: {id: getHistoryUserId}})
			if(user.blockList.includes(userId))
				throw new HttpException("Vous n'êtes pas autorisé à accéder a cette donnée", 400)
			const profil = await this.prisma.profil.findUnique({
				where: {
					userId: getHistoryUserId
				},
				include: {
					matchHistory: {
						orderBy: {
							timeStamp: 'asc',
						},
						select: matchSelect,
					}
				}
			})
			return profil.matchHistory
		}
		catch (error){
			throw new HttpException("Une erreure est survenue", 500)
		}
	}
}
