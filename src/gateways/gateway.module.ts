import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ErrorService } from '../auth/guards/gateway.guard';
import { PrismaService } from '../prisma.service';
import { ProfilModule } from '../profil/profil.module';
import { ChannelService } from '../social/channel/channel.service';
import { ConversationModule } from '../social/conversation/conversation.module';
import { MessageModule } from '../social/message/message.module';
import { MessageService } from '../social/message/message.service';
import { ChannelGatewayService, ChatGatewayService, FriendGatewayService, GameGatewayService, StatusGatewayService } from './events.gateway';

@Module({
	imports: [ConversationModule, ProfilModule, JwtModule, MessageModule],
	providers: [GameGatewayService, ChatGatewayService, StatusGatewayService, FriendGatewayService, ChannelGatewayService, PrismaService, ErrorService, ChannelService, MessageService],
	exports: [ChatGatewayService, StatusGatewayService, FriendGatewayService, ChannelGatewayService, GameGatewayService ],
})
export class GatewayModule {}
