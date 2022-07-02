ARG BASE_IMAGE=node:16-alpine

FROM ${BASE_IMAGE} AS builder
env BUILDDIR=/usr/src/app

# Create app directory
WORKDIR $BUILDDIR

COPY . $BUILDDIR

RUN yarn install

# multitsage-build; alpine for lightweight final image
FROM ${BASE_IMAGE}
ENV NODE_ENV=production
ENV APPDIR=/usr/src/app

# create app direcotyr
WORKDIR $APPDIR
RUN chown node:node ${APPDIR}
COPY --from=builder --chown=node:node ${APPDIR}/index.js .
COPY --from=builder --chown=node:node ${APPDIR}/src src
COPY --from=builder --chown=node:node ${APPDIR}/package.json .
COPY --from=builder --chown=node:node ${APPDIR}/yarn.lock .
USER node

RUN yarn install && yarn cache clean

# express server port
EXPOSE 8080

CMD ["node", "index.js"]