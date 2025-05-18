#!/bin/sh
set -e

# Uruchom serwer ollama w tle
ollama serve &

# Poczekaj aż serwer ollama będzie dostępny
until curl -s http://localhost:11434 > /dev/null; do
  echo "Czekam na uruchomienie ollama..."
  sleep 2
done

# Pobierz model i utwórz go w tle (nie blokuje serwera)
ollama pull gemma3 &
ollama create stepus -f /AI/stepus.yaml || true &

# Trzymaj serwer ollama na pierwszym planie
wait
