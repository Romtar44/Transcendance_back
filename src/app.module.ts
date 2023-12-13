import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { UserController } from "./user/user.controller"
import { UserModule } from "./user/user.module"
import { UserService } from "./user/user.service"
import { PrismaService } from "./prisma.service"
import { ProfilModule } from './profil/profil.module';
import { MatchModule } from './match/match.module';
import { AvatarModule } from './avatar/avatar.module';
import { ChannelModule } from './social/channel/channel.module';
import { MessageModule } from './social/message/message.module';
import { StatModule } from './stat/stat.module';
import { SocialModule } from './social/social.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from "@nestjs/jwt"
import { jwtConstants } from "./auth/constants"
import { GatewayModule } from './gateways/gateway.module';
import { ConversationModule } from './social/conversation/conversation.module';
import { GameController } from './game/game.controller';
import { GameService } from './game/game.service';
import { GameModule } from './game/game.module';
import { SocialService } from "./social/social.service"
import { TfaModule } from "./auth/2fa/tfa.module"

@Module({
	imports: [UserModule, ProfilModule, MatchModule, AvatarModule, ChannelModule, MessageModule, StatModule, SocialModule, AuthModule, TfaModule,
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: "3600s" },
		}),
		GatewayModule,
		ConversationModule,
		GameModule,],
	controllers: [AppController, UserController, GameController],
	providers: [AppService, UserService, PrismaService, GameService, SocialService],
})
export class AppModule {}
