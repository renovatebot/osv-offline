FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:2546d12919612aaf25feb9e064b70618a96dd8752125414d36f040d154ec1587

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm