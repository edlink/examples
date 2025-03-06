FROM node:18-alpine
WORKDIR /usr/src/edlink/api-to-sftp
ENV NODE_ENV production

COPY . .
RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    g++ \
    && yarn \
    && apk del .gyp

ENTRYPOINT [ "yarn", "start" ]
