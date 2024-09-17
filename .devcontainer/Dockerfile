FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:8ee60265fea643d2d29f81435aa3dbf08486f19e492faad4ccfefb3f60fa2b0a

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm