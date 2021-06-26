FROM node:14

WORKDIR /compile
COPY . .
RUN npm run build
COPY ./dist/* /app
RUN rm -rf /compile

WORKDIR /app
CMD ["node", "index.js"]