# build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

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
