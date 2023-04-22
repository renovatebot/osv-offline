FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:950aa3c12624ccbd71b1c5b275e969601f8245e2b2be043dee70877040cd46fb

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm