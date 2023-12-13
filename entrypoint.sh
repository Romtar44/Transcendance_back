#!/bin/sh
cd /transcendance
sleep 30
npx prisma db push
npx prisma db seed
npm run start:dev

