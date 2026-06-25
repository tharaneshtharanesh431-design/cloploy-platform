output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "ecr_web_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "ecr_api_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnets" {
  value = aws_subnet.public[*].id
}

output "private_subnets" {
  value = aws_subnet.private[*].id
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.eks.arn
}

output "alb_ingress_role_arn" {
  value = aws_iam_role.alb_ingress.arn
}
