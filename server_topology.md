# Server Topology & Deployment Strategy

## Overview
This document outlines the production topology for deploying the Real Estate Web Application. The stack consists of:
- **Backend:** Laravel 12 API (PHP 8.2-FPM)
- **Frontend:** Angular 18 with Server-Side Rendering (SSR) via Node.js
- **Web Server:** Nginx (Reverse Proxy & Static Asset server)
- **Process Manager:** PM2 (For keeping Node.js running)

## Topology Architecture
```mermaid
graph TD;
    Internet((Internet)) -->|HTTP/S| Nginx[Nginx Web Server]
    
    subgraph "Production Server"
        Nginx -->|/api/*| PHP_FPM[PHP 8.2 FPM]
        PHP_FPM --> Laravel[Laravel 12 Application]
        
        Nginx -->|/ (All other routes)| PM2[PM2 Process Manager]
        PM2 --> NodeServer[Node.js Server]
        NodeServer --> Angular[Angular 18 SSR Engine]
    end
    
    Laravel --> DB[(MySQL 8 Database)]
    Laravel --> Storage[Local Storage / Public]
```

## Nginx Configuration (Example)
```nginx
server {
    listen 80;
    server_name crete-realestate.com;
    root /var/www/crete/backend/public;

    # Backend API & Storage
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location /storage {
        alias /var/www/crete/backend/storage/app/public;
    }

    # Laravel PHP-FPM
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }

    # Angular SSR Frontend
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PM2 SSR Ecosystem Setup
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'crete-ssr',
    script: '/var/www/crete/frontend/dist/frontend/server/server.mjs',
    instances: 'max', // Scale across all CPU cores
    exec_mode: 'cluster',
    env: {
      PORT: 4000,
      NODE_ENV: 'production'
    }
  }]
};
```

## CI/CD Pipeline Summary
1. `git pull origin main`
2. Backend: `composer install --no-dev`, `php artisan migrate`, `php artisan optimize:clear`
3. Frontend: `npm ci`, `npm run build`
4. SSR Reload: `pm2 reload crete-ssr`
5. Services: `sudo systemctl reload nginx`, `php artisan queue:restart`
