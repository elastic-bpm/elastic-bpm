FROM  node:7-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV DASHBOARD_API_HOST=dashboardapi

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

RUN echo '{ "/api": { "target": "http://dashboardapi:8080",  "secure": false } }' > /usr/src/app/proxy.conf.json

CMD [ "npm", "start" ]