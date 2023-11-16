import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma.service"
import { statSelect } from "../lib/select"

@Injectable()
export class StatService {
    constructor(private prisma: PrismaService) {}

    async findStatById(id: string) {
        return await this.prisma.stat.findUnique({
            where: { id },
            select: statSelect,
        })
    }

    async findAllStat() {
        return await this.prisma.stat.findMany()
    }
}
