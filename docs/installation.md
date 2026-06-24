# Installation Guide

## Requirements
- Node.js 20+
- Docker and Docker Compose
- MongoDB
- AWS CLI
- kubectl
- Terraform 1.7+
- Jenkins and SonarQube

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Optional local services

```bash
docker compose up -d mongodb redis sonarqube jenkins elasticsearch logstash kibana prometheus grafana
```

## Frontend

```bash
cd apps/web
npm install
npm run dev
```

## API

```bash
cd apps/api
npm install
npm run dev
```
