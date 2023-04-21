FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:cc81d433e15098b20e6ddc036199151b85c7cb3a5e5a277f6585f27de729bb8e

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm