FROM node:20-slim AS builder

WORKDIR /app

COPY package.json ./

# Skip full production install if we want to build static SSR image or serve Next.js directly
RUN npm install

COPY . .

# In non-interactive environment, build Next.js app
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "run", "start"]
