FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:1507687a160d77b35a41fb1ce73ddc274dfc8e65c70508559244d54d76dbb858

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm