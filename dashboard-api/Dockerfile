FROM node:7-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV REDIS_HOST=redis API_HOST=api SCALING_HOST=scaling DOCKER_HOST=docker SCHEDULER_HOST=scheduler HUMAN_HOST=human

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

CMD [ "npm", "start" ]