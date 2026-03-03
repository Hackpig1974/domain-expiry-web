FROM nginx:1.28-alpine

# Copy web UI files into image
COPY webserver/index.html /usr/share/nginx/html/index.html
COPY webserver/style.css  /usr/share/nginx/html/style.css
COPY webserver/app.js     /usr/share/nginx/html/app.js
COPY webserver/config.js  /usr/share/nginx/html/config.js

# Copy nginx proxy config
COPY webserver/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
