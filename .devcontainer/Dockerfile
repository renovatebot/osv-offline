FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:774e93e5c2ff1eabe748daac8eec113d42807a911ba6f33a2663ee5a01b2846c

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm