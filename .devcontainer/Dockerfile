FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:ca9789ed00985980f3bd397ef59bcbc46871ea3a4c8ca2bca721fbf55ac4c16e

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm