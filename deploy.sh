#!/bin/bash

# Deployment script for EC2
# Run this on EC2 instance

cd /home/ec2-user/revcart

echo "Pulling latest images..."
docker-compose -f docker-compose.prod.yml pull

echo "Stopping services..."
docker-compose -f docker-compose.prod.yml down

echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Waiting for services to start..."
sleep 30

echo "Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "Deployment complete!"
