FROM ollama/ollama:latest

# Set the working directory
WORKDIR /AI

# Define build argument for model name
ARG MODEL_NAME=gemma3

# Copy the configuration file
COPY stepus.yaml /AI/stepus.yaml

# Replace placeholder in stepus.yaml with the actual model name
RUN sed -i "s/{{MODEL_NAME}}/${MODEL_NAME}/g" /AI/stepus.yaml

# Start the ollama service in the background and pull the model
RUN ollama serve & \
    sleep 5 && \
    ollama pull ${MODEL_NAME} && \ 
    ollama create stepus -f ./stepus.yaml

# Expose the Ollama API port (default is 11434)
EXPOSE 11434
