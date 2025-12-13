FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy packages
COPY packages ./packages
COPY apps/worker ./apps/worker

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @dc-listener/shared run build

# Build worker
RUN pnpm --filter @dc-listener/worker run build

CMD ["pnpm", "--filter", "@dc-listener/worker", "start"]
