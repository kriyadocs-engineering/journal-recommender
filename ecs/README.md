# ECS Deployment Guide

## Architecture

```
                    ┌─────────────────┐
                    │  Application    │
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │  Frontend Task  │           │  Backend Task   │
    │  (Nginx + React)│           │  (Node.js API)  │
    │  Port: 80       │           │  Port: 3001     │
    └─────────────────┘           └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │   Amazon RDS    │
                                  │  (PostgreSQL)   │
                                  └─────────────────┘
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Docker installed and running
3. ECR repositories created:
   - `journal-recommender-frontend`
   - `journal-recommender-backend`

## Setup Steps

### 1. Create ECR Repositories

```bash
aws ecr create-repository --repository-name journal-recommender-frontend
aws ecr create-repository --repository-name journal-recommender-backend
```

### 2. Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push backend
cd backend
docker build -t journal-recommender-backend .
docker tag journal-recommender-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/journal-recommender-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/journal-recommender-backend:latest

# Build and push frontend
cd ../frontend
docker build -t journal-recommender-frontend --build-arg VITE_API_URL=https://api.your-domain.com .
docker tag journal-recommender-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/journal-recommender-frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/journal-recommender-frontend:latest
```

### 3. Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier journal-recommender-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username journal_user \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name <subnet-group>
```

### 4. Store Secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name journal-recommender/database-url \
  --secret-string "postgresql://journal_user:<password>@<rds-endpoint>:5432/journal_recommender"
```

### 5. Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/journal-recommender-backend
aws logs create-log-group --log-group-name /ecs/journal-recommender-frontend
```

### 6. Register Task Definitions

Replace placeholders in task definition files, then:

```bash
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
aws ecs register-task-definition --cli-input-json file://frontend-task-definition.json
```

### 7. Create ECS Services

```bash
# Create backend service
aws ecs create-service \
  --cluster journal-recommender \
  --service-name backend \
  --task-definition journal-recommender-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"

# Create frontend service
aws ecs create-service \
  --cluster journal-recommender \
  --service-name frontend \
  --task-definition journal-recommender-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Server port (3001) | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `API_URL` | Backend API URL | Yes |

## Health Checks

- **Frontend**: `GET /health` returns `200 OK`
- **Backend**: `GET /api/health` returns `{"status":"ok","database":"connected"}`

## Scaling

```bash
# Scale backend
aws ecs update-service --cluster journal-recommender --service backend --desired-count 4

# Scale frontend
aws ecs update-service --cluster journal-recommender --service frontend --desired-count 4
```

## Monitoring

- CloudWatch Logs: `/ecs/journal-recommender-backend`, `/ecs/journal-recommender-frontend`
- CloudWatch Metrics: ECS service metrics
- ALB metrics: Request count, latency, error rates
