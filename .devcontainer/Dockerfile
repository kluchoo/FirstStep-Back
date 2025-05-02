# Używamy uniwersalnego obrazu deweloperskiego od Microsoft jako obrazu bazowego
FROM mcr.microsoft.com/devcontainers/typescript-node
ENV DEBIAN_FRONTEND=noninteractive 

# Instalacja Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    echo 'export BUN_INSTALL="$HOME/.bun"' >> /etc/bash.bashrc && \
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> /etc/bash.bashrc

COPY prisma.sh /usr/local/bin/prisma.sh
RUN chmod +x /usr/local/bin/prisma.sh

RUN set -ex && \
    chmod +x /etc/bash.bashrc && \
    echo alias stepus=\"docker exec -it stepus ollama run stepus\" >> /etc/bash.bashrc && \
    echo alias baza="bunx prisma generate" >> /etc/bash.bashrc && \
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
