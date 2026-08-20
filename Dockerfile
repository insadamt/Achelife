# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# Stage 1: Build React / Vite assets
# ------------------------------------------------------------
FROM node:22-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ------------------------------------------------------------
# Stage 2: Install production Composer dependencies
# ------------------------------------------------------------
FROM php:8.4-fpm-alpine AS vendor

WORKDIR /var/www/html

# git allows Composer to fall back to source downloads if
# GitHub dist/ZIP downloads temporarily fail.
RUN apk add --no-cache git unzip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

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
FROM php:8.4-fpm-alpine AS app

WORKDIR /var/www/html

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
FROM caddy:2-alpine AS web

WORKDIR /srv

COPY --from=vendor /var/www/html/public /srv/public
COPY --from=frontend /app/public/build /srv/public/build
COPY docker/selfhost/Caddyfile /etc/caddy/Caddyfile
