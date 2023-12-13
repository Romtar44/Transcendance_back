import { Module } from '@nestjs/common';
import { GameGatewayService } from 'src/gateways/events.gateway';
import { PrismaService } from 'src/prisma.service';
import { SocialModule } from 'src/social/social.module';
import { SocialService } from 'src/social/social.service';
import { GameController } from './game.controller';
import { GameService } from './game.service';


@Module({})
export class GameModule {
	import: [SocialModule]
	controllers: [GameController]
    providers: [GameService, PrismaService, GameGatewayService, SocialService]
	exports: [GameService]

}
