FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:dc23a5d6cbe43d9179e9e8a67abc1db72d136a125eca71fae3c5e9815e03ba81

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm