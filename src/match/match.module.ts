import { Module } from "@nestjs/common"
import { MatchController } from "./match.controller"
import { MatchService } from "./match.service"
import { PrismaService } from "../prisma.service"
import { SocialModule } from "../social/social.module"
import { SocialService } from "../social/social.service"

@Module({
    controllers: [MatchController],
    providers: [MatchService, PrismaService],
})
export class MatchModule {}
