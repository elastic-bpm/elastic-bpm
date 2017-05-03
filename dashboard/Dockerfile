FROM  node:7-slim as temp

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV DASHBOARD_API_HOST=dashboardapi

COPY package.json /usr/src/app/
COPY yarn.lock /usr/src/app/
RUN yarn install

COPY . /usr/src/app

RUN yarn build

FROM nginx:1-alpine as final
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY --from=temp /usr/src/app/dist /usr/share/nginx/html