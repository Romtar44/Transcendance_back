import { Injectable, OnModuleDestroy } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements  OnModuleDestroy  {
	userSelect: any
	async onModuleInit()
	{
		await this.$connect()
		await this.user.updateMany( {data: {socketNumber: 0}})
		await this.profil.updateMany( {data: {status: "OFFLINE"}})
	}

	async onModuleDestroy()
	{
		await this.$disconnect()
	}
}

