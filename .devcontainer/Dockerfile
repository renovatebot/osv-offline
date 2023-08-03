FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:473a7c664e91cb8768ea82e0845d2e9a9681aa0cf7b8f6af17eb87c4b6a6099a

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm