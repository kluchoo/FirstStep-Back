# === Builder Stage ===
FROM oven/bun:alpine AS builder

WORKDIR /app

# Only copy package files first for efficient caching of dependencies
COPY package.json bun.lock ./

# Install dependencies
RUN bun install


# Copy only Prisma files for generate step
COPY prisma ./prisma
COPY .env .env 

# Generate Prisma client
RUN bunx prisma generate


# Copy the rest of the project files
COPY . .

# Generate Prisma client and build the app
RUN bun run build

RUN mv ./uploads ./dist/


# === Production Stage ===
FROM oven/bun:alpine AS production

WORKDIR /app

# Copy only the required files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./

# Install only production dependencies
RUN bun install --production

COPY --from=builder /app/prisma ./prisma
RUN bunx prisma generate
COPY --from=builder /app/prisma ./prisma

# Optional: Remove Prisma dev dependencies if already generated
# No need to regenerate the client if it's built already
# So we remove this line:
COPY --from=builder /app/dist/ .
COPY src/swagger.json ./src/swagger.json

CMD ["bun", "run", "prod"]
# CMD ["ls" "-la"]
# CMD ["bun", "run", "start"]

