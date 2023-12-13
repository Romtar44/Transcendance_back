import { Injectable } from "@nestjs/common";
import { AuthGuard as AuthGuard42 } from '@nestjs/passport';

@Injectable()
export class SchoolAuthGuard extends AuthGuard42('42') {
}
