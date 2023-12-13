import {
    Controller,
    Get,
    Param,
    HttpException,
    HttpStatus,
} from "@nestjs/common"
import { StatService } from "./stat.service"

@Controller("stat")
export class StatController {
    constructor(private readonly StatService: StatService) {}

    @Get("/getStat/:id")
    async getStat(@Param("id") param: string) {
        const stat = await this.StatService.findStatById(param)

        if (stat) return stat
        else throw new HttpException("Stat not found !", HttpStatus.BAD_REQUEST)
    }

    @Get("/getAllStat/")
    async getAllStat() {
        return this.StatService.findAllStat()
    }
}
