pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-dockerhub-username'
        EC2_HOST = 'your-ec2-public-ip'
        EC2_USER = 'ec2-user'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-username/RevCart_Microservice.git'
            }
        }
        
        stage('Test & Build Services') {
            parallel {
                stage('User Service') {
                    steps {
                        dir('user-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Product Service') {
                    steps {
                        dir('product-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Cart Service') {
                    steps {
                        dir('cart-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Order Service') {
                    steps {
                        dir('order-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Payment Service') {
                    steps {
                        dir('payment-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Delivery Service') {
                    steps {
                        dir('delivery-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Notification Service') {
                    steps {
                        dir('notification-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Analytics Service') {
                    steps {
                        dir('analytics-service') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Gateway') {
                    steps {
                        dir('revcart-gateway') {
                            bat 'mvn clean test package -DskipTests'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('Frontend') {
                            bat 'npm ci && npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    bat """
                        docker build -t ${DOCKER_REGISTRY}/revcart-user-service:${BUILD_NUMBER} ./user-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-product-service:${BUILD_NUMBER} ./product-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-cart-service:${BUILD_NUMBER} ./cart-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-order-service:${BUILD_NUMBER} ./order-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-payment-service:${BUILD_NUMBER} ./payment-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-delivery-service:${BUILD_NUMBER} ./delivery-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-notification-service:${BUILD_NUMBER} ./notification-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-analytics-service:${BUILD_NUMBER} ./analytics-service
                        docker build -t ${DOCKER_REGISTRY}/revcart-gateway:${BUILD_NUMBER} ./revcart-gateway
                        docker build -t ${DOCKER_REGISTRY}/revcart-frontend:${BUILD_NUMBER} ./Frontend
                        
                        docker tag ${DOCKER_REGISTRY}/revcart-user-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-user-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-product-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-product-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-cart-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-cart-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-order-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-order-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-payment-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-payment-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-delivery-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-delivery-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-notification-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-notification-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-analytics-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-analytics-service:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-gateway:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-gateway:latest
                        docker tag ${DOCKER_REGISTRY}/revcart-frontend:${BUILD_NUMBER} ${DOCKER_REGISTRY}/revcart-frontend:latest
                    """
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        bat """
                            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                            docker push ${DOCKER_REGISTRY}/revcart-user-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-user-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-product-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-product-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-cart-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-cart-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-order-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-order-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-payment-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-payment-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-delivery-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-delivery-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-notification-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-notification-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-analytics-service:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-analytics-service:latest
                            docker push ${DOCKER_REGISTRY}/revcart-gateway:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-gateway:latest
                            docker push ${DOCKER_REGISTRY}/revcart-frontend:${BUILD_NUMBER}
                            docker push ${DOCKER_REGISTRY}/revcart-frontend:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        bat """
                            ssh -i %SSH_KEY% -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "cd /home/ec2-user/revcart && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d"
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
