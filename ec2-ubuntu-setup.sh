#!/bin/bash

# EC2 Setup Script for Ubuntu

echo "=== RevCart EC2 Setup (Ubuntu) ==="

# Update system
sudo apt update -y
sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create directory
mkdir -p /home/ubuntu/revcart
cd /home/ubuntu/revcart

# Create .env file
cat > .env << 'EOF'
DOCKER_REGISTRY=amanpardeshi01
MYSQL_ROOT_PASSWORD=SecurePassword123
MYSQL_DATABASE=revcart_db
MYSQL_HOST=mysql
MYSQL_PORT=3306
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-production-secret-key
JWT_EXPIRATION=86400000
EOF

echo "=== Setup Complete ==="
echo "Log out and back in, then copy docker-compose.prod.yml here"
