import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ErrorService } from 'src/auth/guards/gateway.guard';
import { PrismaService } from 'src/prisma.service';
import { ProfilModule } from 'src/profil/profil.module';
import { ChannelService } from 'src/social/channel/channel.service';
import { ConversationModule } from 'src/social/conversation/conversation.module';
import { MessageModule } from 'src/social/message/message.module';
import { MessageService } from 'src/social/message/message.service';
import { ChannelGatewayService, ChatGatewayService, FriendGatewayService, GameGatewayService, StatusGatewayService } from './events.gateway';

@Module({
	imports: [ConversationModule, ProfilModule, JwtModule, MessageModule],
	providers: [GameGatewayService, ChatGatewayService, StatusGatewayService, FriendGatewayService, ChannelGatewayService, PrismaService, ErrorService, ChannelService, MessageService],
	exports: [ChatGatewayService, StatusGatewayService, FriendGatewayService, ChannelGatewayService, GameGatewayService ],
})
export class GatewayModule {}
