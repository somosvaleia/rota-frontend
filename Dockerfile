# build
FROM node:22-alpine AS builder
WORKDIR /app

# build args vindos do EasyPanel (Build Args)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SITE_URL
ARG VITE_N8N_WEBHOOK_URL

# o Vite só "enxerga" em tempo de build se estiver no ENV
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL

COPY package*.json ./

# IMPORTANTE: se teu lock estiver fora de sync, npm ci quebra.
# Pra não travar deploy, usa npm install.
RUN npm install

COPY . .
RUN npm run build

# serve (nginx)
FROM nginx:alpine

# SPA static files
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config (porta 3000 + fallback do React Router)
RUN printf 'server {\n\
  listen 3000;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
