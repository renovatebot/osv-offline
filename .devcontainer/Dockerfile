FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:3469c3e3c9a1d9346cbc784fe32186ee4d70e1a0919305d1582a09b26944035c

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm