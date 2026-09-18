# Etapa de build: instala todas as dependências e compila o TypeScript
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Etapa final: imagem enxuta somente com dependências de produção e o código compilado
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
