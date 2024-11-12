FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:22@sha256:dc2c3654370fe92a55daeefe9d2d95839d85bdc1f68f7fd4ab86621f49e5818a

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm