# Stage 1: Build the React frontend
# Use a Node.js image to create a build environment
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code and build the static files
COPY frontend/ ./
RUN npm run build


# Stage 2: Build the Django backend
# Use a lean Python image for the final application
FROM python:3.10-slim

ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY backend/ ./

# Copy the built frontend files from the 'frontend-builder' stage
COPY --from=frontend-builder /app/frontend/dist ./staticfiles

# Expose the port the app will run on
EXPOSE 8000

# The command to run the Daphne ASGI server in production
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]