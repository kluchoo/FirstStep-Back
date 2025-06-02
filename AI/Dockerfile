FROM ollama/ollama:latest

# Set the working directory
WORKDIR /AI

# Define build argument for model name
ARG MODEL_NAME=gemma3

# Copy the configuration file
COPY stepus.yaml /AI/stepus.yaml

# Replace placeholder in stepus.yaml with the actual model name
RUN sed -i "s/{{MODEL_NAME}}/${MODEL_NAME}/g" /AI/stepus.yaml

# Zamiast uruchamiać ollama pull i ollama create podczas budowania obrazu,
# przygotuj skrypt startowy, który wykona te polecenia po starcie kontenera.

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Usuń CMD z Dockerfile, bo domyślny ENTRYPOINT obrazu ollama to "ollama".
# Ustaw ENTRYPOINT na własny skrypt, aby Docker uruchamiał Twój entrypoint.sh.

ENTRYPOINT ["/entrypoint.sh"]

# Expose the Ollama API port (default is 11434)
EXPOSE 11434

# Dodaj instalację curl, bo obraz ollama/ollama nie ma go domyślnie
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
