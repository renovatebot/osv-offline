FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:44804f4cfde7fb1b8962eafb384b67d5350fb6ae5f5a97c923c8cb6e4804bb2f

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm