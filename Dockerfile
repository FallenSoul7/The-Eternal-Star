# ==========================================
# STAGE 1: Build Stage
# ==========================================
FROM node:24 AS build

# FIX: Completely disable pnpm 11's strict build security prompt
ENV pnpm_config_strict_dep_builds=false

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY back/package.json ./back/
COPY shared/package.json ./shared/

# Allow lockfile updates to prevent crash from new packages
RUN pnpm install --no-frozen-lockfile

COPY shared ./shared/
RUN pnpm run build:shared

# ==========================================
# STAGE 2: Production Stage
# ==========================================
# uWebSockets.js requires glibc >= 2.38 -> Debian Trixie
FROM node:24-trixie-slim

# FIX: Completely disable pnpm 11's strict build security prompt
ENV pnpm_config_strict_dep_builds=false

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY back/package.json ./back/
COPY shared/package.json ./shared/

# Install production dependencies allowing lockfile updates
RUN pnpm install --no-frozen-lockfile --prod

# Copy shared source + compiled dist
COPY --from=build /app/shared ./shared/

# Copy back source + tsconfig
COPY back/tsconfig.json ./back/
COPY back/src ./back/src

# Run from back/ so Node resolves tsx from back/node_modules
WORKDIR /app/back

# Probe TCP port 8001 – container is healthy once the WS server is accepting connections
HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "const n=require('net').createConnection(8001,'localhost'); n.on('connect',()=>{n.destroy();process.exit(0);}); n.on('error',()=>process.exit(1));"

# Start the game server
CMD ["node", "--import", "tsx/esm", "src/sandbox.ts"]
