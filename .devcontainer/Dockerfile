FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:18@sha256:c09caad59935dc670050bc90c84398ec622fc751d54fd45fb171ce563e450493

RUN echo "deb https://deb.debian.org/debian unstable main" > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g npm