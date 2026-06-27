# Imagine de producție pentru backend-ul InvestPals.
FROM node:20-slim AS build
WORKDIR /app
# OpenSSL e necesar pentru engine-ul Prisma.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
EXPOSE 4000
# migrate deploy aplică migrările, apoi pornește serverul (care auto-populează instrumentele).
CMD ["npm", "run", "start:prod"]
