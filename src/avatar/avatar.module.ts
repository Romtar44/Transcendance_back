import { Module } from "@nestjs/common"
import { AvatarController } from "./avatar.controller"
import { AvatarService } from "./avatar.service"
import { PrismaService } from "../prisma.service"

@Module({
    controllers: [AvatarController],
    providers: [AvatarService, PrismaService],
	exports: [AvatarService]
})
export class AvatarModule {}
