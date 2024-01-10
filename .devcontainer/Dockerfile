FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:185cde4e033cd68fb4c5c9eef94ba6bde0dac2f334ecd1a7cf6cd2c87f712d85

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm