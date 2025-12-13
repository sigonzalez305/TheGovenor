FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @dc-listener/shared run build

# Build web app
RUN pnpm --filter @dc-listener/web run build

EXPOSE 3000

CMD ["pnpm", "--filter", "@dc-listener/web", "start"]
