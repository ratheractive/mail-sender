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
# ENV SMTP_HOST
# ENV SMTP_PORT
# ENV SMTP_USER
# ENV SMTP_PASSWORD
# ENV TO_EMAIL
# ENV CONFIRMATION_SUBJECT
# ENV FORM_TO_SMTP_SUBJECT

COPY --chown=nobody --from=builder /opt/app/dist /opt/app/dist
CMD ["dist/app.js"]
