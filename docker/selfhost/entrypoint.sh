#!/bin/sh
set -eu

# ------------------------------------------------------------
# Self-hosted defaults
# ------------------------------------------------------------
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"

export DB_CONNECTION="${DB_CONNECTION:-sqlite}"
export DB_DATABASE="${DB_DATABASE:-/data/achelife.sqlite}"

DATA_DIR="$(dirname "$DB_DATABASE")"
APP_KEY_FILE="/data/app-key"

echo "Starting Achelife self-hosted setup..."

# ------------------------------------------------------------
# Persistent data directory
# ------------------------------------------------------------
mkdir -p "$DATA_DIR"

if [ "$DB_CONNECTION" = "sqlite" ]; then
    if [ ! -f "$DB_DATABASE" ]; then
        echo "Creating SQLite database..."
        touch "$DB_DATABASE"
    fi
fi

# ------------------------------------------------------------
# Persistent Laravel APP_KEY
# ------------------------------------------------------------
if [ -n "${APP_KEY:-}" ]; then
    if [ -f "$APP_KEY_FILE" ] && [ "$(cat "$APP_KEY_FILE")" != "$APP_KEY" ]; then
        echo "The configured application key conflicts with the persisted key." >&2
        exit 1
    fi

    if [ ! -f "$APP_KEY_FILE" ]; then
        printf '%s' "$APP_KEY" > "$APP_KEY_FILE"
        chmod 600 "$APP_KEY_FILE"
    fi
else
    if [ -f "$APP_KEY_FILE" ]; then
        APP_KEY="$(cat "$APP_KEY_FILE")"
        echo "Using existing Achelife application key."
    else
        echo "Generating Achelife application key..."

        APP_KEY="$(
            php -r 'echo "base64:" . base64_encode(random_bytes(32));'
        )"

        printf '%s' "$APP_KEY" > "$APP_KEY_FILE"
        chmod 600 "$APP_KEY_FILE"
    fi

    export APP_KEY
fi

# ------------------------------------------------------------
# Laravel writable directories
# ------------------------------------------------------------
mkdir -p \
    storage/app/public \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data \
    /data \
    storage \
    bootstrap/cache

# ------------------------------------------------------------
# Prepare Laravel
# ------------------------------------------------------------
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
fi

echo "Refreshing Laravel caches..."
php artisan optimize:clear
php artisan config:cache
php artisan view:cache

echo "Achelife initialization complete."

exec "$@"
