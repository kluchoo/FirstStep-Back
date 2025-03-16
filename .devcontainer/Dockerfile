# Używamy uniwersalnego obrazu deweloperskiego od Microsoft jako obrazu bazowego
FROM mcr.microsoft.com/devcontainers/typescript-node
ENV DEBIAN_FRONTEND=noninteractive 

COPY prisma.sh /usr/local/bin/prisma.sh
RUN chmod +x /usr/local/bin/prisma.sh




RUN set -ex && \
    chmod +x /etc/bash.bashrc && \
    echo alias stepus=\"docker exec -it stepus ollama run stepus\" >> /etc/bash.bashrc && \
    apt-get update && \
    apt-get install -y --no-install-recommends nala && \
    nala install -y --no-install-recommends curl apt-transport-https ca-certificates ffmpeg && \
    curl -sSL https://raw.githubusercontent.com/vegardit/fast-apt-mirror.sh/v1/fast-apt-mirror.sh -o /usr/local/bin/fast-apt-mirror.sh && \
    chmod 755 /usr/local/bin/fast-apt-mirror.sh && \
    /usr/local/bin/fast-apt-mirror.sh find --apply && \
    echo alias baza="npx prisma generate" >> /etc/bash.bashrc && \
    chmod +x /etc/bash.bashrc && \
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
