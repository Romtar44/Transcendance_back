import { Module } from "@nestjs/common"
import { ChannelController } from "./channel.controller"
import { ChannelService } from "./channel.service"
import { PrismaService } from "src/prisma.service"
import { GatewayModule } from "src/gateways/gateway.module"
import { MessageModule } from "../message/message.module"
import { MessageService } from "../message/message.service"
import { ErrorService } from "src/auth/guards/gateway.guard"

@Module({
	controllers: [ChannelController],
	providers: [ChannelService, PrismaService, MessageService, ErrorService],
	imports: [MessageModule, GatewayModule],
	exports: [ChannelService]
})
export class ChannelModule {}
