FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:a7bc0757bbcd8b6fba012112c4bb73bb5ace6cd914179cc7f5e2299c5913562c

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm