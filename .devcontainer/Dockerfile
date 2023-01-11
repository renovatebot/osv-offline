FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:9b39ca64bc306c05a27e3d7f81ade9544ed16181f377e9f71f2e0d006fc7868d

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm