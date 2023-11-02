FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:cc247507b2f003369a532d81fa531a5308daae65f41adb1f983b99074c2f7e1c

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm