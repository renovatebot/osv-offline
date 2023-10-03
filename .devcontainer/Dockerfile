FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:593375ddf74a32654c1160dee8bdb0d0e5236ed1304032fb68a61e8c78778b37

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm