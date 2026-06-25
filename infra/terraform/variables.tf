variable "aws_region" {
  type        = string
  description = "AWS Region"
  default     = "ap-southeast-2"
}

variable "project_slug" {
  type        = string
  description = "Project name"
  default     = "cloploy"
}

variable "image_tag" {
  type        = string
  description = "Docker image tag"
  default     = "latest"
}

variable "cluster_name" {
  type        = string
  description = "EKS Cluster Name"
  default     = "cloploy-eks"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR Block"
  default     = "10.40.0.0/16"
}

variable "public_subnets" {
  type        = list(string)
  description = "Public subnet CIDRs"

  default = [
    "10.40.1.0/24",
    "10.40.2.0/24"
  ]
}

variable "private_subnets" {
  type        = list(string)
  description = "Private subnet CIDRs"

  default = [
    "10.40.11.0/24",
    "10.40.12.0/24"
  ]
}

variable "node_instance_type" {
  type        = string
  description = "EKS node group instance type"
  default     = "t3.medium"
}