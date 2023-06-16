FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:72434df58ef2c80043c9219e2784ab6cc8eb8a7284fb2ca5027fb8df48315076

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm