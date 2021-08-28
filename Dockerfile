FROM node:latest

WORKDIR /home/code

RUN apt-get update \ 
  && apt-get install -y ffmpeg \
  && mkdir riki \
  && mkdir tmp

VOLUME /home/code/riki

COPY . .

RUN npm install

EXPOSE 3006

CMD [ "npm", "run", "start"]