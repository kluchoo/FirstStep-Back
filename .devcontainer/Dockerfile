FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Instalacja dodatkowych narzędzi
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    wget \
    git \
    gnupg \
    lsb-release \
    ca-certificates \
    apt-transport-https

# Instalacja Bun
USER node
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/node/.bun/bin:${PATH}"

# Przejdź z powrotem do roota dla pozostałych instalacji
USER root

# Dodaj bash alias dla Bun
RUN echo 'export PATH="/home/node/.bun/bin:$PATH"' >> /home/node/.bashrc \
    && echo 'alias baza="bunx prisma generate && bunx prisma-dbml-generator"' >> /home/node/.bashrc

# Czyszczenie
RUN apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*
