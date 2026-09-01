# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# Stage 1: Build React / Vite assets
# ------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ------------------------------------------------------------
# Stage 2: Install production Composer dependencies
# ------------------------------------------------------------
FROM --platform=$BUILDPLATFORM composer:2@sha256:4d71c3c2109c61d5415544264b59ad4087e4c5b7244481723664138fd36d5040 AS composer-bin

FROM --platform=$BUILDPLATFORM php:8.4-fpm-alpine@sha256:6cb5e4ffa03a7c1b01bb5b120ab3684ef76b75aa5ca417e343936db3f71f419f AS vendor

WORKDIR /var/www/html

# git allows Composer to fall back to source downloads if
# GitHub dist/ZIP downloads temporarily fail.
RUN set -eux; \
    apk add --no-cache git unzip libzip; \
    apk add --no-cache --virtual .php-extension-build-dependencies $PHPIZE_DEPS libzip-dev; \
    docker-php-ext-install zip; \
    apk del .php-extension-build-dependencies

COPY --from=composer-bin /usr/bin/composer /usr/bin/composer

# Dependency installation is cached as long as these two files
# do not change.
COPY composer.json composer.lock ./

RUN set -eux; \
    attempt=1; \
    while [ "$attempt" -le 3 ]; do \
        if composer install \
            --no-dev \
            --prefer-dist \
            --no-interaction \
            --no-progress \
            --no-scripts \
            --no-autoloader; then \
            break; \
        fi; \
        if [ "$attempt" -eq 3 ]; then \
            echo "Composer install failed after 3 attempts." >&2; \
            exit 1; \
        fi; \
        echo "Composer download failed. Retrying in 5 seconds..."; \
        attempt=$((attempt + 1)); \
        sleep 5; \
    done

# Now copy the actual application.
COPY . .

# Build the optimized autoloader after the Laravel application
# exists. This also runs the normal post-autoload-dump hooks.
RUN composer dump-autoload \
    --optimize \
    --classmap-authoritative \
    --no-interaction


# ------------------------------------------------------------
# Stage 3: Achelife application
# ------------------------------------------------------------
FROM php:8.4-fpm-alpine@sha256:6cb5e4ffa03a7c1b01bb5b120ab3684ef76b75aa5ca417e343936db3f71f419f AS app

WORKDIR /var/www/html

RUN set -eux; \
    apk add --no-cache libzip; \
    apk add --no-cache --virtual .php-extension-build-dependencies $PHPIZE_DEPS libzip-dev; \
    docker-php-ext-install zip; \
    apk del .php-extension-build-dependencies

ARG ACHELIFE_VERSION=1.0.0-rc.1-dev
ARG ACHELIFE_REVISION=unknown
ENV ACHELIFE_VERSION=$ACHELIFE_VERSION
LABEL org.opencontainers.image.title="Achelife" \
      org.opencontainers.image.description="Single-user, self-hosted life management" \
      org.opencontainers.image.version=$ACHELIFE_VERSION \
      org.opencontainers.image.revision=$ACHELIFE_REVISION \
      org.opencontainers.image.source="https://github.com/insadamt/Achelife" \
      org.opencontainers.image.documentation="https://github.com/insadamt/Achelife/blob/master/SELF_HOSTING.md" \
      org.opencontainers.image.licenses="MIT"

COPY --from=vendor --chown=www-data:www-data /var/www/html /var/www/html
COPY --from=frontend --chown=www-data:www-data /app/public/build /var/www/html/public/build

COPY docker/selfhost/entrypoint.sh /usr/local/bin/achelife-entrypoint
COPY docker/selfhost/php-fpm.conf /usr/local/etc/php-fpm.d/zz-achelife.conf

RUN chmod +x /usr/local/bin/achelife-entrypoint \
    && mkdir -p /data \
    && mkdir -p \
        storage/app/public \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data \
        /data \
        storage \
        bootstrap/cache

ENTRYPOINT ["achelife-entrypoint"]
CMD ["php-fpm"]


# ------------------------------------------------------------
# Stage 4: Caddy web server
# ------------------------------------------------------------
FROM caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648 AS web

WORKDIR /srv

RUN apk upgrade --no-cache

ARG ACHELIFE_VERSION=1.0.0-rc.1-dev
ARG ACHELIFE_REVISION=unknown
LABEL org.opencontainers.image.title="Achelife Web" \
      org.opencontainers.image.description="Web gateway for the Achelife self-hosted application" \
      org.opencontainers.image.version=$ACHELIFE_VERSION \
      org.opencontainers.image.revision=$ACHELIFE_REVISION \
      org.opencontainers.image.source="https://github.com/insadamt/Achelife" \
      org.opencontainers.image.documentation="https://github.com/insadamt/Achelife/blob/master/SELF_HOSTING.md" \
      org.opencontainers.image.licenses="MIT"

COPY --from=vendor /var/www/html/public /srv/public
COPY --from=frontend /app/public/build /srv/public/build
COPY docker/selfhost/Caddyfile /etc/caddy/Caddyfile
