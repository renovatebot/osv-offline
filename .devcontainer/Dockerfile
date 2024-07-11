FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:2dc3c7f910d191689c203e356fc3812d7a12750f6b52711a75fbc1c5de557f21

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm