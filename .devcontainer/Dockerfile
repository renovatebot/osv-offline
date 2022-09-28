FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:e8d04ffcd08009d4ec70b5d453d35ae59696a4b73e10483dc2c4975b4f72fb7b

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm