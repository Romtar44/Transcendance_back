FROM node

WORKDIR /transcendance

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

COPY entrypoint.sh /transcendance

WORKDIR /

RUN chmod +x transcendance/prisma/seed.ts

RUN chmod +x /transcendance/entrypoint.sh

EXPOSE 3333

ENTRYPOINT bash /transcendance/entrypoint.sh
