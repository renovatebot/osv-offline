FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:7271883c9dfe41bb8794182df6e414287260ec273b9d4c59450c29718e9121e2

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm