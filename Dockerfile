FROM docker.io/library/node:20-bookworm-slim AS runtime
WORKDIR /app

# Copiar definiciones y generar cliente Prisma en Linux
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev --legacy-peer-deps && npx prisma generate

# Copiar el build compilado
COPY dist ./dist

EXPOSE 3000 3001
CMD ["node", "dist/src/main.js"]
