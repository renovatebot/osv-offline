FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:725b80c692548ad40cd9bb20d548be4d2bfca5478525326f29ea2698023f6bbb

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm