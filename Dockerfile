# Set nginx base image
FROM node:16
LABEL maintainer="Hantsy Bai"
WORKDIR  /app
COPY  ./dist ./dist
COPY package.json .
RUN  npm install --only=production --ignore-scripts
EXPOSE 3000
CMD ["node", "dist/main"]
