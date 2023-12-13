import {
	Controller,
	Get,
	Put,
	Request,
	UseGuards,
	Body,
	Param,
} from "@nestjs/common"
import { ChannelService } from "./channel.service"
import { MyAuthGuard } from "src/auth/guards/jwt.auth.guard"
import { createChannelDTO, manageChannelDTO, protectedChannelApplicationDTO, manageUserChannelDTO } from "src/lib/DTOs/social.dto";

@Controller("channel")
export class ChannelController {
	constructor(private readonly channelService: ChannelService) {}

	@UseGuards(MyAuthGuard)
	@Get("/get-channels")
	async getChannels(@Request() req: any)
	{
		return await this.channelService.getAllUsersChannels(req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Get("/get-channel/:id")
	async getChannel(@Param('id') channelId: string)
	{
		return await this.channelService.findChannel(channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put("/enter-channel")
	async channelApplication(@Body() channelApplicationDTO: manageChannelDTO,  @Request() req: any, )
	{
		return await this.channelService.channelApplicationManager(req.user.sub, channelApplicationDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put("/enter-protected-channel")
	async protectedChannelApplication(@Body() protectedChannelApplicationDTO: protectedChannelApplicationDTO,  @Request() req: any, )
	{
		return await this.channelService.protectedChannelApplicationManager(req.user.sub, protectedChannelApplicationDTO.channelId, protectedChannelApplicationDTO.password)
	}

	@UseGuards(MyAuthGuard)
	@Get("/getChannelAddable")
	async getChannelAddable(@Request() req: any) {
		return await this.channelService.findAddableChannels(req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Put('/newChannel')
	async newChannel(@Request() req: any, @Body() createChannelDTO: createChannelDTO)
	{
		try
		{
			return await this.channelService.createChannel(createChannelDTO, req.user.sub)
		}
		catch (error)
		{
			throw error;
		}
	}

	@UseGuards(MyAuthGuard)
	@Get("/getFriendAddable")
	async getFriendAddable(@Body() addableFriendsDTO: manageChannelDTO, @Request() req: any) {
		return await this.channelService.findAddableFriends(req.user.sub, addableFriendsDTO.channelId)
	}


	@UseGuards(MyAuthGuard)
	@Put('/remove-channel')
	async removeChannel(@Body() channelRemoveDTO: manageChannelDTO, @Request() req: any) {
		return await this.channelService.leaveChannel(channelRemoveDTO.channelId, req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Put('/destroy-channel')
	async deleteChannel(@Body() channelDestroyDTO: manageChannelDTO, @Request() req: any) {
		return await this.channelService.destroyChannel(channelDestroyDTO.channelId, undefined, req.user.sub)
	}

	@UseGuards(MyAuthGuard)
	@Put('/invite-channel')
	async inviteChannel(@Body() inviteToChannelDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.inviteFriend(inviteToChannelDTO.channelId, req.user.sub, inviteToChannelDTO.userId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/kick-channel')
	async kickFromChannel(@Body() kickChannelDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.kickUser(req.user.sub, kickChannelDTO.userId, kickChannelDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/transmit-channel')
	async transmitChannel(@Body() transmitChannelDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.transmitOwnership(req.user.sub, transmitChannelDTO.userId, transmitChannelDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/add-admin-channel')
	async addAdminChannel(@Body() givePrivilegeDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.addAdmin(req.user.sub, givePrivilegeDTO.userId, givePrivilegeDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/remove-admin-channel')
	async removeAdminChannel(@Body() removePrivilegeDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.removeAdmin(req.user.sub, removePrivilegeDTO.userId, removePrivilegeDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/mute-user-channel')
	async muteUserChannel(@Body() muteUserDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.muteUser(req.user.sub, muteUserDTO.userId, muteUserDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/unmute-user-channel')
	async unmuteUserChannel(@Body() unmuteUserDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.unMuteUser(req.user.sub, unmuteUserDTO.userId, unmuteUserDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/ban-user-channel')
	async banUserChannel(@Body() banUserDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.banUser(req.user.sub, banUserDTO.userId, banUserDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Get('/message-channel')
	async getMessages(@Body() channelConvDTO: manageChannelDTO, @Request() req: any) {
		return await this.channelService.findAllMessages(req.user.sub, channelConvDTO.channelId)
	}

	@UseGuards(MyAuthGuard)
	@Get('/member-profil-channel/:id')
	async getMemberProfil(@Param("id") channelId: string , @Request() req: any) {
		return await this.channelService.findAllProfil(req.user.sub, channelId)
	}

	@UseGuards(MyAuthGuard)
	@Get('/ban-profil-channel/:id')
	async getBanProfil(@Param("id") channelId: string , @Request() req: any) {
		return await this.channelService.findAllBannedProfil(req.user.sub, channelId)
	}

	@UseGuards(MyAuthGuard)
	@Put('/unban-user-channel')
	async unbanUserChannel(@Body() unbanUserDTO: manageUserChannelDTO, @Request() req: any) {
		return await this.channelService.unbanUser(req.user.sub, unbanUserDTO.userId, unbanUserDTO.channelId)
	}
}
