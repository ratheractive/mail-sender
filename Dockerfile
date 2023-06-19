FROM node:16-alpine AS builder
WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn install --ignore-optional
COPY . .
RUN yarn test
RUN yarn build

FROM node:16-alpine
COPY package.json yarn.lock ./
RUN yarn install --prod --ignore-scripts
USER nobody
WORKDIR /opt/app
ENV NODE_ENV production
ENV PORT 80

COPY --chown=nobody --from=builder /opt/app/dist /opt/app/dist
COPY --chown=nobody --from=builder /opt/app/templates /opt/app/templates

CMD ["dist/app.js"]
