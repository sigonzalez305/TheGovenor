FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @dc-listener/shared run build

# Build API
RUN pnpm --filter @dc-listener/api run build

EXPOSE 3001

CMD ["pnpm", "--filter", "@dc-listener/api", "start"]
