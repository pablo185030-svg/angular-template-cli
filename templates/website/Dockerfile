# Build first: `npm run build` (output in dist/coto-angular-template).
FROM node:24-slim
WORKDIR /app
COPY ./dist/coto-angular-template/ ./dist/coto-angular-template/

# The SSR server is a self-contained bundle (server.mjs), so no node_modules are needed.
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/coto-angular-template/server/server.mjs"]
