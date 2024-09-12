FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:ebbd38835d50f9a4973cab245d3d931a6215947e6ebfdf91f3d1ebdff7c09fcb

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm