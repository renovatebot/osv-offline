FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:173debabac3a927225aac3fa451dfd1baa780d5fb8f8e513b1efc615e3221225

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm