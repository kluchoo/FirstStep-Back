#!/bin/bash

echo "Uruchamianie konfiguracji Prisma..."

# Instalacja zależności projektu z użyciem Bun
echo "Instalowanie zależności projektu..."
bun install

# Uruchamianie kontenera PostgreSQL z obsługą błędów i już istniejącego kontenera
echo "Konfiguracja PostgreSQL..."

# Sprawdzanie, czy sieć już istnieje
if ! docker network ls | grep -q "FirstStep"; then
    echo "Tworzenie sieci Docker FirstStep..."
    docker network create FirstStep
fi

# Sprawdzanie, czy kontener PostgreSQL już istnieje
if ! docker ps -a | grep -q "FirstStep"; then
    echo "Tworzenie kontenera PostgreSQL..."
    docker run -d --name FirstStep --network FirstStep -e POSTGRES_PASSWORD=secret postgres
else
    # Sprawdź czy kontener jest uruchomiony
    if ! docker ps | grep -q "FirstStep"; then
        echo "Uruchamianie istniejącego kontenera PostgreSQL..."
        docker start FirstStep
    else
        echo "Kontener PostgreSQL już działa."
    fi
fi

# Czekaj na pełne uruchomienie PostgreSQL
echo "Oczekiwanie na pełne uruchomienie PostgreSQL..."
sleep 5

# Generowanie klienta Prisma
echo "Generowanie plików Prisma..."
bunx prisma generate
bunx prisma-dbml-generator

echo "Konfiguracja Prisma zakończona pomyślnie!"
