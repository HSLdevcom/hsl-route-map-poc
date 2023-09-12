FROM node:18-alpine

ENV WORK /opt/mappoc
ENV NODE_ENV=production

RUN mkdir -p ${WORK}
WORKDIR ${WORK}

COPY package.json yarn.lock ${WORK}/

RUN yarn install && yarn cache clean
COPY . ${WORK}

ARG BUILD_ENV=production
COPY .env.${BUILD_ENV} ${WORK}/.env

CMD [ "yarn", "start" ]
