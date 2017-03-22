FROM node:7-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV WORKFLOWS=workflows SCALING=scaling DOCKER=docker

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

CMD [ "npm", "run", "prod" ]