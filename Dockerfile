FROM nginx:alpine

COPY webserver/ /usr/share/nginx/html/
COPY webserver/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
