FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:ab708870fc67ba025a4ce00be740ab6e94f3ea7f2fb5781be26ed0a034150050

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm