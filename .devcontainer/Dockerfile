FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:14

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm