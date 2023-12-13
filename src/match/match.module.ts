import { Module } from "@nestjs/common"
import { MatchController } from "./match.controller"
import { MatchService } from "./match.service"
import { PrismaService } from "src/prisma.service"
import { SocialModule } from "src/social/social.module"
import { SocialService } from "src/social/social.service"

@Module({
    controllers: [MatchController],
    providers: [MatchService, PrismaService],
})
export class MatchModule {}
