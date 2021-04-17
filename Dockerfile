# Set nginx base image
FROM node:15
LABEL maintainer="Hantsy Bai"
WORKDIR  /app
COPY  ./dist ./dist
COPY package.json .
RUN  npm install --production --ignore-scripts
EXPOSE 3000
CMD ["node", "dist/main"]
