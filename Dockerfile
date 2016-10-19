FROM node:6.8.0-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV DEBUG=express:* REDIS_HOST=redis API_HOST=api SCALING_HOST=scaling

COPY package.json /usr/src/app/
RUN npm run install

COPY . /usr/src/app

CMD [ "npm", "start" ]