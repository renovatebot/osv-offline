FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:c258d970c416c860c973e1e8cd4b1c8e8245f187374dd15904ef1f4893da1069

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm