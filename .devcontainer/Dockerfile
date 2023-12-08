FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:b8ba70ff2b6a1fd247b7f12b18b1f3d0a06c157328fdd860926d41646e626a7e

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm