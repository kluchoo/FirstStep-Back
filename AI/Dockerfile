FROM ollama/ollama:latest

# Set the working directory
WORKDIR /AI

# Copy the configuration file
COPY stepus.yaml /AI/stepus.yaml

# Start the ollama service in the background and pull the model
RUN ollama serve & \
    sleep 5 && \
    ollama pull gemma3:latest && \ 
    ollama create stepus -f ./stepus.yaml

# Expose the Ollama API port (default is 11434)
EXPOSE 11434
