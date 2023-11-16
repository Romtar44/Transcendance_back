import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { PrismaService } from "./../prisma.service";
import { UserController } from "./user.controller";
import { ProfilModule } from "src/profil/profil.module";
import { ProfilService } from "src/profil/profil.service";
import { AvatarModule } from "src/avatar/avatar.module";
import { AvatarService } from "src/avatar/avatar.service";
import { AuthModule } from "src/auth/auth.module";


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
