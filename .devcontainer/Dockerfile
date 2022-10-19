FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:12e6d7c726773506610cf87e989bc335cf7f2f85c90f6d645232a4d89a09e443

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm