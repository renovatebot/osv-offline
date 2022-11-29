FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:21a188d5780e11135f9027be2870768e32f2571eeab74ddebc5c2bf344a61a9d

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm