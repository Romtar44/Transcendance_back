import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient()
async function main()
{
	const buffer = await fs.promises.readFile("asset/defaultPP.jpg")
	const bufferChan = await fs.promises.readFile("asset/defaultPPChanel.jpg")
	await prisma.avatar.upsert({
		where: { id: 1},
		update: {img: buffer}, 
		create: {img: buffer} })
	await prisma.avatar.upsert({
		where: { id: 2},
		update: {img: bufferChan}, 
		create: {img: bufferChan} })
}

main()
	.then(async () => {await prisma.$disconnect()})
	.catch(async (error) => {
	await prisma.$disconnect()
	process.exit(1) })
