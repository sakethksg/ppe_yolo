# Docker Deployment Guide for PPE Detection System

This guide provides instructions for deploying the PPE Detection application using Docker and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM
- 10GB of free disk space

## 🏗️ Project Structure

```
ppe_yolo/
├── Dockerfile.backend          # Backend API Dockerfile
├── Dockerfile.frontend         # Frontend Web Dockerfile
├── docker-compose.yml          # Default Docker Compose (Production)
├── docker-compose.dev.yml      # Development Docker Compose
├── docker-compose.prod.yml     # Production with PostgreSQL
├── .dockerignore              # Docker ignore file
├── backend/                   # Backend Python code
├── frontend/                  # Frontend Next.js code
├── mlsrc/                    # ML model weights
└── output/                   # Output directory
```

## 🚀 Quick Start

### Development Mode

Start the application in development mode with hot-reload:

```bash
# Start services
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Production Mode (SQLite)

Start the application in production mode with SQLite database:

```bash
# Build and start services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Production Mode (PostgreSQL)

Start the application with PostgreSQL database:

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Docker Commands

### Building Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with logs
docker-compose up
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Managing Containers

```bash
# List running containers
docker-compose ps

# Execute command in container
docker-compose exec backend python --version
docker-compose exec frontend npm --version

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Restart service
docker-compose restart backend
```

## 🔍 Service Details

### Backend API Service

- **Port**: 8000
- **Technology**: FastAPI + YOLO
- **Database**: SQLite (default) or PostgreSQL (production)
- **Endpoints**:
  - `/` - API information
  - `/health` - Health check
  - `/predict` - Image prediction (JSON)
  - `/predict-image` - Image prediction (annotated image)
  - `/docs` - Swagger UI

### Frontend Web Service

- **Port**: 3000
- **Technology**: Next.js 16 + React 19
- **Features**:
  - Image upload and detection
  - Live camera detection
  - Analytics dashboard
  - Compliance monitoring

## 🌐 Environment Variables

### Backend

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=sqlite:///./data/ppe_detection.db
# DATABASE_URL=postgresql://ppe_user:ppe_password@postgres:5432/ppe_detection

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Model Configuration
MODEL_CONFIDENCE_THRESHOLD=0.25
```

### Frontend

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
NODE_ENV=production
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/

# Check from inside Docker network
docker-compose exec frontend curl http://backend:8000/health
```

### Docker Health Status

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' ppe-detection-backend
```

## 🗄️ Data Persistence

### Volumes

- `backend-data`: Backend database and persistent data
- `postgres-data`: PostgreSQL database (in production mode)

### Backup Database

```bash
# SQLite backup
docker-compose exec backend cp /app/data/ppe_detection.db /app/output/backup.db
docker cp ppe-detection-backend:/app/output/backup.db ./backup.db

# PostgreSQL backup
docker-compose exec postgres pg_dump -U ppe_user ppe_detection > backup.sql
```

### Restore Database

```bash
# SQLite restore
docker cp ./backup.db ppe-detection-backend:/app/data/ppe_detection.db

# PostgreSQL restore
docker-compose exec -T postgres psql -U ppe_user ppe_detection < backup.sql
```

## 🔒 Security Considerations

1. **Change default passwords** in production
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** with SSL certificates
4. **Limit exposed ports** to necessary services
5. **Regular security updates** for base images

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :8000
   
   # Change port in docker-compose.yml
   ports:
     - "8001:8000"
   ```

2. **Model not found**
   ```bash
   # Ensure model weights exist
   ls mlsrc/weights/best.pt
   
   # Check volume mounting
   docker-compose exec backend ls /app/mlsrc/weights/
   ```

3. **Out of memory**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop > Settings > Resources > Memory
   ```

4. **Container keeps restarting**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Check health status
   docker inspect ppe-detection-backend
   ```

### Clean Reset

```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Remove unused data
docker system prune -a

# Rebuild and start
docker-compose up -d --build
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Use load balancer (nginx)
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Remove old images
docker image prune -f
```

### Update Dependencies

```bash
# Backend
docker-compose exec backend pip install --upgrade -r requirements.txt

# Frontend
docker-compose exec frontend npm update

# Rebuild images
docker-compose build --no-cache
```

## 📝 Logs Management

### Log Rotation

Configure Docker daemon (`/etc/docker/daemon.json`):

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Export Logs

```bash
# Export all logs
docker-compose logs > application.log

# Export with timestamp
docker-compose logs --timestamps > application-$(date +%Y%m%d).log
```

## 🎯 Production Deployment Checklist

- [ ] Update environment variables
- [ ] Change default passwords
- [ ] Enable SSL/TLS certificates
- [ ] Configure proper firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure automated backups
- [ ] Enable log rotation
- [ ] Test health checks
- [ ] Document recovery procedures
- [ ] Set up CI/CD pipeline

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI in Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🆘 Support

For issues and questions:
1. Check the logs: `docker-compose logs -f`
2. Review health checks: `docker-compose ps`
3. Inspect containers: `docker inspect <container_name>`
4. Check documentation above

## 📄 License

This project is part of the PPE Detection system.
