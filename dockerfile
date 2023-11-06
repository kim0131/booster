# 사용할 이미지 지정
FROM node:16-alpine3.14

WORKDIR /app

COPY package.json /app

RUN npm i -y 
RUN npm install ts-node --save-dev
RUN npm install typescript -g 
RUN npm install typescript --save-dev

COPY . /app
COPY CPClient_linux_x64 /app
RUN chmod 755 /app/CPClient_linux_x64
RUN npx prisma db pull
RUN npx prisma generate

EXPOSE 3001 

CMD [ "npm","start"]
