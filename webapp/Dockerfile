FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

COPY webapp/package.json ./
RUN npm install --omit=dev

COPY webapp/ .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
