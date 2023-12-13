import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { PrismaService } from 'src/prisma.service';
import { GatewayModule } from 'src/gateways/gateway.module';
import { ConversationModule } from './conversation/conversation.module';
import { GameModule } from 'src/game/game.module';

@Module({
  controllers: [SocialController],
  providers: [SocialService, PrismaService],
  imports: [GatewayModule, ConversationModule, GameModule]
})
export class SocialModule {}
