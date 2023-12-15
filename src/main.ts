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
		origin: [`${process.env.FRONT_URL}`],
		methods: "GET,HEAD,PUT,POST,DELETE,OPTIONS",
		credentials: true,
	});
	await app.listen(process.env.PORT || 5000);
}
bootstrap();
