FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:0eb31a8984693e6aab3acfd15a78356137ef77955a77378f2ef4f9f581681ac6

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm