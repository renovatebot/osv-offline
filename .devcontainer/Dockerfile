FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:99565fbe35c07dbb976e5145e1fae58d6317b2a007703eaec6a66a6c22b5c513

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm