FROM node:14
WORKDIR /compile
COPY ./ ./
RUN ls -la
RUN npm install
RUN npm run build

FROM node:14
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install --only=production
COPY --from=0 /compile/dist .
RUN npm install pm2 -g

EXPOSE 8100
EXPOSE 443
CMD ["pm2-runtime", "index.js"]