terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.54"
    }
  }

  backend "s3" {
    bucket         = "cloploy-terraform-state"
    key            = "platform/global.tfstate"
    region         = "ap-southeast-2"
    encrypt        = true
    dynamodb_table = "cloploy-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_slug
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}