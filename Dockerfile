FROM node:latest

WORKDIR /home/code

RUN apt-get update \ 
  && apt-get install -y ffmpeg \
  && mkdir riki \
  && mkdir temp

VOLUME /home/code/riki

COPY . .

RUN npm install -g -f pm2 \
  && npm install

EXPOSE 3006

CMD [ "pm2", "start", "index.js"]