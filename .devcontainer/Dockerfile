FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:20@sha256:381a1fde32704f229b439ade94816d5619f710e35698982ec35afcd9384ae6cf

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm