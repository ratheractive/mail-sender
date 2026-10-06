FROM node:24-alpine AS builder
WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-optional
COPY . .
RUN yarn test
RUN yarn build

FROM node:24-alpine
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --prod --ignore-scripts
USER nobody
WORKDIR /opt/app
ENV NODE_ENV=production
ENV PORT=80
ARG VERSION=dev
ENV APP_VERSION=$VERSION

COPY --chown=nobody --from=builder /opt/app/dist /opt/app/dist
COPY --chown=nobody --from=builder /opt/app/templates /opt/app/templates

CMD ["dist/app.js"]
