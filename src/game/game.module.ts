import { Module } from '@nestjs/common';
import { GameGatewayService } from '../gateways/events.gateway';
import { PrismaService } from '../prisma.service';
import { SocialModule } from '../social/social.module';
import { SocialService } from '../social/social.service';
import { GameController } from './game.controller';
import { GameService } from './game.service';


@Module({})
export class GameModule {
	import: [SocialModule]
	controllers: [GameController]
    providers: [GameService, PrismaService, GameGatewayService, SocialService]
	exports: [GameService]

}
