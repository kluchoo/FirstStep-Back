#! /usr/bin/env bash

# Instalacja zależności projektu z użyciem Bun
bun install

# Uruchomienie kontenera PostgreSQL
docker pull postgres
docker network create FirstStep
docker run -d --name FirstStep --network FirstStep -e POSTGRES_PASSWORD=secret postgres

# Generowanie klienta Prisma
bunx prisma generate
bunx prisma-dbml-generator
