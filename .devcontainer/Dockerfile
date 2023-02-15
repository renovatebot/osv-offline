FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:cb1ab6160f5f1314051805a02a14d5eba44fcf5fd357964ff4d9c5cc9dd48a23

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm