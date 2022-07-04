FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:16@sha256:2219ea4f20c580fed4bc68331e765865a6f50d92c5ce32d83864ab9fbd75f040

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm