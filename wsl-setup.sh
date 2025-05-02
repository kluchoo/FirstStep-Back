#!/bin/bash

# Instalacja Bun
echo "Instalowanie Bun..."
curl -fsSL https://bun.sh/install | bash

# Dodanie Bun do PATH
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Instalacja PostgreSQL
echo "Instalowanie PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Uruchomienie i konfiguracja PostgreSQL
echo "Konfiguracja PostgreSQL..."
sudo service postgresql start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'secret';"
sudo -u postgres psql -c "CREATE DATABASE firststep;"

# Instalacja zależności projektu
echo "Instalacja zależności projektu..."
bun install

# Generowanie plików Prisma
echo "Generowanie plików Prisma..."
bunx prisma generate
bunx prisma-dbml-generator

# Konfiguracja Git hooks
echo "Konfiguracja Git hooks..."
echo '#!/bin/sh
# Pre-commit hook

echo "Sprawdzanie kodu przed zatwierdzeniem..."

# Wykonanie lint
bunx eslint --fix

# Sprawdzenie typów TypeScript
bunx tsc --noEmit

# Jeśli któryś z powyższych kroków się nie powiedzie, przerwij commit
if [ $? -ne 0 ]; then
    echo "Znaleziono błędy! Przerwanie zatwierdzania zmian."
    exit 1
fi

echo "Kod przeszedł sprawdzenie. Kontynuowanie zatwierdzania zmian."
exit 0' > .git/hooks/pre-commit

chmod +x .git/hooks/pre-commit

echo "Środowisko WSL z Bun zostało skonfigurowane!"
