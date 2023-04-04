FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:5b4f4c329c6d6b683582f67f63e9f24510ed9b74c6d2e89fa546b82af9aae9e5

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm