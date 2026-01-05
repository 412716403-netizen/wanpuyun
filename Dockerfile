# --- 阶段 1: 依赖安装 ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
# 使用国内镜像源加速安装
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# --- 阶段 2: 编译打包 ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client 并构建应用
RUN npx prisma generate
RUN npm run build

# --- 阶段 3: 运行环境 ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动脚本：先运行数据库迁移，再启动应用
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
