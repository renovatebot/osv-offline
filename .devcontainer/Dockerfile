FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:50a98183ddaaaa45ca965dcfe511418c6bd615926334b833af62cbbbba449a69

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm