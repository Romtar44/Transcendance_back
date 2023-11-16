import { Module } from "@nestjs/common"
import { ChannelController } from "./channel.controller"
import { ChannelService } from "./channel.service"
import { PrismaService } from "../prisma.service"
import { GatewayModule } from "../gateways/gateway.module"
import { MessageModule } from "../message/message.module"
import { MessageService } from "../message/message.service"
import { ErrorService } from "../auth/guards/gateway.guard"

@Module({
	controllers: [ChannelController],
	providers: [ChannelService, PrismaService, MessageService, ErrorService],
	imports: [MessageModule, GatewayModule],
	exports: [ChannelService]
})
export class ChannelModule {}
