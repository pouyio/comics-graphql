ARG BASE_IMAGE=node:16-alpine

FROM ${BASE_IMAGE} AS builder
env BUILDDIR=/usr/src/app

# Latest releases available at https://github.com/aptible/supercronic/releases
ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.2.2/supercronic-linux-amd64 \
    SUPERCRONIC=supercronic-linux-amd64 \
    SUPERCRONIC_SHA1SUM=2319da694833c7a147976b8e5f337cd83397d6be

# Create app directory
WORKDIR $BUILDDIR

COPY . $BUILDDIR

RUN apk add curl

RUN curl -fsSLO "$SUPERCRONIC_URL" \
 && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
 && chmod +x "$SUPERCRONIC" \
 && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
 && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/supercronic

RUN yarn install

# multitsage-build; alpine for lightweight final image
FROM ${BASE_IMAGE}
ENV NODE_ENV=production
ENV APPDIR=/usr/src/app

# create app directory
WORKDIR $APPDIR
RUN chown node:node ${APPDIR}
COPY --from=builder --chown=node:node ${APPDIR}/index.js .
COPY --from=builder --chown=node:node ${APPDIR}/src src
COPY --from=builder --chown=node:node ${APPDIR}/package.json .
COPY --from=builder --chown=node:node ${APPDIR}/yarn.lock .
COPY --from=builder ${APPDIR}/crontab .
USER node

RUN yarn install && yarn cache clean

# express server port
EXPOSE 8080


CMD ["node", "index.js"]