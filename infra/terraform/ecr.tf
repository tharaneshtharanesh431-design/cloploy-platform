resource "aws_ecr_repository" "project" {
  name                 = var.project_slug
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "cloploy-terraform-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration { status = "Enabled" }
}
