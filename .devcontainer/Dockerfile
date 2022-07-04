FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:b867add5a536faf98c32b75d239d2c827fa58da501158153095e6fbade1d1b7a

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm