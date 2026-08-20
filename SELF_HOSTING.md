# Achelife Self-Hosting

Achelife can run locally using Docker.

Your application data is stored persistently in Docker volumes, so rebuilding or restarting Achelife does not delete your account or data.

## Requirements

You only need:

- Docker
- Docker Compose

You do not need to install PHP, Composer, Node.js, PostgreSQL, or SQLite manually.

## Install

Clone Achelife:

```bash
git clone https://github.com/insadamt/Achelife.git
cd Achelife
```

Start Achelife:

```bash
./achelife start
```

Achelife automatically selects an available local port.

Example:

```text
Achelife is ready.
http://localhost:8081
```

Open the displayed URL in your browser.

## Commands

Start Achelife:

```bash
./achelife start
```

Check its status and URL:

```bash
./achelife status
```

Stop Achelife:

```bash
./achelife stop
```

Restart Achelife:

```bash
./achelife restart
```

View logs:

```bash
./achelife logs
```

## Updating Achelife

Pull the latest version:

```bash
git pull
```

Then rebuild:

```bash
./achelife rebuild
```

Achelife keeps the existing database and application data during rebuilds.

Database migrations are applied automatically when the new version starts.

## Ports

On the first start, Achelife automatically finds an available port between:

```text
8080-8999
```

The selected port is remembered locally.

For example:

```text
http://localhost:8082
```

Future starts and rebuilds will continue using that port when possible.

If the port becomes unavailable, Achelife can select another available port.

## Data

Achelife uses SQLite for the self-hosted installation.

Persistent application data is stored in Docker volumes.

Stopping or rebuilding the containers does not delete this data.

Do not run:

```bash
docker compose down -v
```

unless you intentionally want to delete the persistent Docker volumes.

## Local Access

By default Achelife binds only to:

```text
127.0.0.1
```

This means Achelife is accessible only from the computer running it.

Remote internet exposure is not enabled by default.
