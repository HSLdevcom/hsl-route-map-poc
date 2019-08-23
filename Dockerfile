FROM node:lts-alpine

ENV WORK /opt/mappoc

RUN mkdir -p ${WORK}
WORKDIR ${WORK}

COPY package.json ${WORK}
COPY yarn.lock ${WORK}

RUN yarn install
COPY . ${WORK}

ARG BUILD_ENV=production
COPY .env.${BUILD_ENV} ${WORK}/.env

CMD [ "yarn", "start" ]
