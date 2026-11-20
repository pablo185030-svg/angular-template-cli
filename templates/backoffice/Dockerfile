# Build first: `npm run build` (static output in dist/coto-angular-template/browser).
FROM nginx:1.27.3
COPY ./dist/coto-angular-template/browser/ /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
