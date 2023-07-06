FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:731f11852ce9c3b5913b2f747d9cd2d5befc5ea1bab6d8ee997903061792cd6b

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm