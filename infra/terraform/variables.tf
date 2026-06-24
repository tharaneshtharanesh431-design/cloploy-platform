variable "aws_region" { type = string default = "us-east-1" }
variable "project_slug" { type = string default = "cloploy" }
variable "image_tag" { type = string default = "latest" }
variable "cluster_name" { type = string default = "cloploy-eks" }
variable "vpc_cidr" { type = string default = "10.40.0.0/16" }
variable "public_subnets" { type = list(string) default = ["10.40.1.0/24", "10.40.2.0/24"] }
variable "private_subnets" { type = list(string) default = ["10.40.11.0/24", "10.40.12.0/24"] }
