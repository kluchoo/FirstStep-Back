# Używamy uniwersalnego obrazu deweloperskiego od Microsoft jako obrazu bazowego
FROM mcr.microsoft.com/devcontainers/typescript-node:latest
ENV DEBIAN_FRONTEND=noninteractive 

# Instalacja Bun - bezpośrednia instalacja w globalnej ścieżce
RUN curl -fsSL https://bun.sh/install | bash && \
    mkdir -p /usr/local/bun && \
    cp -r $HOME/.bun/* /usr/local/bun/ && \
    echo 'export BUN_INSTALL="/usr/local/bun"' >> /etc/bash.bashrc && \
    echo 'export PATH="/usr/local/bun/bin:$PATH"' >> /etc/bash.bashrc && \
    ln -s /usr/local/bun/bin/bun /usr/local/bin/bun

# Kopiowanie i przygotowanie skryptu prisma
COPY prisma.sh /usr/local/bin/prisma.sh
RUN chmod +x /usr/local/bin/prisma.sh

RUN set -ex && \
    chmod +x /etc/bash.bashrc && \
    echo 'alias stepus="docker exec -it stepus ollama run stepus"' >> /etc/bash.bashrc && \
    echo 'alias baza="bunx prisma generate"' >> /etc/bash.bashrc && \
    # Clean up
    apt-get clean && \
    apt-get autoremove -y && \
    rm -rf \
    /var/lib/apt/lists/* \
    /tmp/* \
    /var/tmp/* \
    /usr/share/doc/* \
    /usr/share/man/* \
    /var/log/*
