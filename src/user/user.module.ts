import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { PrismaService } from "./../prisma.service";
import { UserController } from "./user.controller";
import { ProfilModule } from "../profil/profil.module";
import { ProfilService } from "../profil/profil.service";
import { AvatarModule } from "../avatar/avatar.module";
import { AvatarService } from "../avatar/avatar.service";
import { AuthModule } from "../auth/auth.module";


@Module({
  controllers: [UserController],
  imports: [ProfilModule, AvatarModule, AuthModule],
  providers: [
    UserService,
    PrismaService,
    ProfilService,
    AvatarService,
  ],
})
export class UserModule {}
