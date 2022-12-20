FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:5ebf71e16383cb59862570c0092fd1b48101eca3631c79f05145cfcde71750c1

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm