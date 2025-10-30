# Makefile for PPE Detection Docker Management

.PHONY: help build up down restart logs clean dev prod ps shell test backup restore

# Default target
help:
	@echo "PPE Detection Docker Management"
	@echo "================================"
	@echo ""
	@echo "Available commands:"
	@echo "  make build       - Build all Docker images"
	@echo "  make up          - Start all services (production)"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make clean       - Remove all containers, volumes, and images"
	@echo "  make dev         - Start services in development mode"
	@echo "  make prod        - Start services in production mode with PostgreSQL"
	@echo "  make ps          - Show running containers"
	@echo "  make shell-be    - Access backend shell"
	@echo "  make shell-fe    - Access frontend shell"
	@echo "  make test        - Run tests"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database from backup"
	@echo ""

# Build all images
build:
	@echo "Building Docker images..."
	docker-compose build

# Build without cache
build-nc:
	@echo "Building Docker images without cache..."
	docker-compose build --no-cache

# Start services (production)
up:
	@echo "Starting services in production mode..."
	docker-compose up -d
	@echo "Services started! Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

# Start services in development mode
dev:
	@echo "Starting services in development mode..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development services started with hot-reload enabled!"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"

# Start services in production mode with PostgreSQL
prod:
	@echo "Starting services in production mode with PostgreSQL..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production services started!"
	@echo "  Nginx:    http://localhost:80"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down
	docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes
down-v:
	@echo "Stopping all services and removing volumes..."
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v

# Restart services
restart:
	@echo "Restarting services..."
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-be:
	docker-compose logs -f backend

logs-fe:
	docker-compose logs -f frontend

# Show running containers
ps:
	docker-compose ps

# Access backend shell
shell-be:
	docker-compose exec backend bash

# Access frontend shell
shell-fe:
	docker-compose exec frontend sh

# Access database shell (PostgreSQL)
shell-db:
	docker-compose -f docker-compose.prod.yml exec postgres psql -U ppe_user -d ppe_detection

# Run tests
test:
	@echo "Running backend tests..."
	docker-compose exec backend pytest

# Clean up everything
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --rmi all
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker-compose -f docker-compose.prod.yml down -v --rmi all
	docker system prune -f

# Backup database (SQLite)
backup:
	@echo "Backing up database..."
	docker-compose exec backend cp /app/data/ppe_detection.db /app/output/backup-$(shell date +%Y%m%d-%H%M%S).db
	@echo "Backup completed!"

# Backup database (PostgreSQL)
backup-prod:
	@echo "Backing up PostgreSQL database..."
	docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ppe_user ppe_detection > backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "Backup completed!"

# Restore database (SQLite)
restore:
	@echo "Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	docker cp $$backup_file ppe-detection-backend:/app/data/ppe_detection.db
	@echo "Database restored!"

# Health check
health:
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health | python -m json.tool
	@echo ""
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000

# Update and restart
update:
	@echo "Updating application..."
	git pull origin main
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "Application updated and restarted!"

# View resource usage
stats:
	docker stats --no-stream

# Install (first time setup)
install:
	@echo "Setting up PPE Detection application..."
	@echo "1. Building images..."
	docker-compose build
	@echo "2. Starting services..."
	docker-compose up -d
	@echo "3. Waiting for services to be ready..."
	@sleep 10
	@echo "4. Checking health..."
	@make health
	@echo ""
	@echo "Installation complete!"
	@echo "Access the application at:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
