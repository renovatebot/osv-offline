FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:43f8b8a3b8fcd01821f243601fec333a9cc8778afbd9acc3374555a4406515c7

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm