import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";


require("dotenv").config({ path: __dirname + "/./../../.env" });

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(new ValidationPipe());
	app.enableShutdownHooks();
	app.use(cookieParser());
	app.enableCors({
		origin: [`${process.env.FRONT_URL}`, `http://localhost:3333`, ` http://192.168.1.190:3333`],
		methods: "GET,HEAD,PUT,POST,DELETE,OPTIONS",
		credentials: true,
	});
	await app.listen(3333);
}
bootstrap();
