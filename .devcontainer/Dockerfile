FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:abb334b5ac0b177f5cfb1e682181ad26412f188268f2168016c92949bc69904b

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm