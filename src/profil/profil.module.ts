import { Module } from "@nestjs/common"
import { ProfilController } from "./profil.controller"
import { ProfilService } from "./profil.service"
import { PrismaService } from "../prisma.service"
import { AvatarService } from "../avatar/avatar.service"

@Module({
    controllers: [ProfilController],
    providers: [ProfilService, PrismaService, AvatarService],
	exports: [ProfilService]
})
export class ProfilModule {}
