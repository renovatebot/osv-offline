FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:87f45e7d18579ffbe6370697cd77bf921669d0d6d3643eda3920426432fe461a

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm