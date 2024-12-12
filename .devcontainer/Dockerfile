FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:22@sha256:9791f4aa527774bc370c6bd2f6705ce5a686f1e6f204badd8dfaacce28c631ae

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm