FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:6de2529d57a5fe6383ec81526af61a30c7629cf889762f247690962a8ae257c7

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm