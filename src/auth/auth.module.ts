import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "src/prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "./constants";
import { ProfilModule } from "src/profil/profil.module";
import { SchoolStrategy } from "./strategies/school.strategy";
import { JwtTwoFaStrategy } from "./strategies/jwt-tfa.strategy";

@Module({
  imports: [
	ProfilModule,
	JwtModule.register({
	  global: true,
	  secret: jwtConstants.secret,
	  signOptions: { expiresIn: "7380s" },
	}),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, SchoolStrategy, JwtTwoFaStrategy],
  exports: [AuthService],
})

export class AuthModule {}
