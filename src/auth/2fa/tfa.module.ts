import { Module } from "@nestjs/common";
import { TfaService } from "./tfa.service";
import { TfaController } from "./tfa.controller";
import { PrismaService } from "src/prisma.service";
import { JwtTwoFaStrategy } from "../strategies/jwt-tfa.strategy";
import { AuthModule } from "../auth.module";

@Module({
	imports: [AuthModule],
	controllers: [TfaController],
	providers: [TfaService, PrismaService, JwtTwoFaStrategy],
	exports: [TfaService],
})

export class TfaModule {}
