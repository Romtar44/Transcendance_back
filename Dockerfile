FROM node

WORKDIR /

COPY package.json .
COPY . .
RUN npm install --legacy-peer-deps

COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

EXPOSE 3333

ENTRYPOINT bash ./entrypoint.sh
