FROM node:15
RUN npm install -g npm@7.19.0
WORKDIR /compile
COPY ./ ./
RUN npm install
RUN npm run build

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN mv /compile/dist/* ./
RUN rm -rf /compile
RUN npm install --only=production
RUN npm install pm2 -g

EXPOSE 8100
EXPOSE 80
EXPOSE 443
CMD ["pm2-runtime", "index.js"]