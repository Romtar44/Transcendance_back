import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaService } from 'src/prisma.service';
import { MessageModule } from '../message/message.module';

@Module({
	imports: [MessageModule],
	controllers: [ConversationController],
	providers: [ConversationService, PrismaService],
	exports: [ConversationService]
})
export class ConversationModule {}
