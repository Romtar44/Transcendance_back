import { 	Controller,
	Get,
	Post,
	Request,
	Body,
	UseGuards, } from '@nestjs/common';
import { SocialService } from './social.service';
import { MyAuthGuard } from "src/auth/guards/jwt.auth.guard";
import { manageUserDTO } from "src/lib/DTOs/social.dto";

@Controller('social')
export class SocialController {
	constructor(private readonly socialService: SocialService) {}

	@UseGuards(MyAuthGuard)
	@Get("/get-friend-list")
	async getFriendList(@Request() req: any) {
		return (await this.socialService.findFriendList(req.user.sub))
	}

	@UseGuards(MyAuthGuard)
	@Get("/get-profils-friend-list")
	async getUsersFromFriendList(@Request() req: any) {
		return (await this.socialService.findProfilsFromFriendList(req.user.sub))
	}

	@UseGuards(MyAuthGuard)
	@Post("/add-new-friend")
	async addFriend(@Body() addFriendDTO: manageUserDTO, @Request() req: any) {
		return (await this.socialService.addFriend(req.user.sub, addFriendDTO.userId))
	}

	@UseGuards(MyAuthGuard)
	@Post("/remove-friend")
	async removeFriend(@Body() removeFriendDTO: manageUserDTO, @Request() req: any) {
		return (await this.socialService.removeFriend(req.user.sub, removeFriendDTO.userId))
	}

	@UseGuards(MyAuthGuard)
	@Post("/block-user")
	async blockUser(@Body() blockUserDTO: manageUserDTO, @Request() req: any) {
		return await this.socialService.blockUser(req.user.sub, blockUserDTO.userId)
	}

	@UseGuards(MyAuthGuard)
	@Post("/unblock-user")
	async unblockUser(@Body() unblockUserDTO: manageUserDTO, @Request() req: any) {
		return await this.socialService.unblockUser(req.user.sub, unblockUserDTO.userId)
	}

	@UseGuards(MyAuthGuard)
	@Post("/accept-friend")
	async acceptFriend(@Body() acceptFriendDTO: manageUserDTO, @Request() req: any) {
		return (await this.socialService.acceptFriend(req.user.sub, acceptFriendDTO.userId))
	}



}
