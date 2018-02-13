FROM node:carbon

WORKDIR /opt/mappoc

COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]