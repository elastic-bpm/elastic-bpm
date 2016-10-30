FROM node:7-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV DEBUG=express:*

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

CMD [ "npm", "start" ]