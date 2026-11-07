# syntax=docker/dockerfile:1
FROM php:8.3-apache-bookworm AS php-base
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git unzip libzip-dev libpng-dev libjpeg62-turbo-dev \
    libfreetype6-dev libonig-dev libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j2 pdo_mysql mbstring gd zip intl bcmath \
    && a2enmod rewrite headers \
    && (getent group 1000 >/dev/null || groupadd --gid 1000 render-secrets) \
    && usermod -a -G 1000 www-data \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html

FROM php-base AS dependencies
COPY . .
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY public ./public
COPY vite.config.* tsconfig.json ./
# Vite resolves ziggy-js from Composer's vendor directory.
COPY --from=dependencies /var/www/html/vendor ./vendor
RUN npm run build

FROM php-base AS app
COPY --from=dependencies /var/www/html ./
COPY --from=frontend /app/public/build ./public/build
RUN mkdir -p storage/app/private storage/app/public \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x deploy/render-start.sh
COPY deploy/apache.conf /etc/apache2/sites-available/000-default.conf
COPY deploy/php.ini /usr/local/etc/php/conf.d/graduate-school.ini
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr PORT=10000
EXPOSE 10000
CMD ["/var/www/html/deploy/render-start.sh"]
