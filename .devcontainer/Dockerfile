FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:ac09ab0d7edb7cecbeed8ad2dd90bb61aac9e9d6ce9d0c1d026889696de814eb

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm