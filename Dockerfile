# Set nginx base image
FROM node:14
LABEL maintainer="Hantsy Bai"
WORKDIR  /app
COPY  ./dist ./dist
COPY package.json .
RUN  npm install --production
EXPOSE 3000
CMD ["node", "dist/main"]
