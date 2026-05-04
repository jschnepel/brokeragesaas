# Build:
#   cd real-estate-platform
#   docker buildx build -f infra/lambda/armls-parquet-export.Dockerfile \
#     -t armls-parquet-export:latest --platform linux/amd64 .
#
# Push:
#   aws ecr create-repository --repository-name rlsir-armls-parquet-export --region us-east-1
#   aws ecr get-login-password --region us-east-1 | docker login --username AWS \
#     --password-stdin 828301486081.dkr.ecr.us-east-1.amazonaws.com
#   docker tag armls-parquet-export:latest \
#     828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-armls-parquet-export:latest
#   docker push 828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-armls-parquet-export:latest
#
# Deploy:
#   aws lambda create-function --function-name rlsir-armls-parquet-export \
#     --package-type Image \
#     --code ImageUri=828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-armls-parquet-export:latest \
#     --role arn:aws:iam::828301486081:role/rlsir-armls-parquet-export-role \
#     --memory-size 2048 --timeout 900 --region us-east-1
# python:3.12 image runs on Amazon Linux 2023 (glibc 2.34+).
# python:3.11 is on AL2 (glibc 2.26) which is too old for DuckDB 1.4 extensions.
FROM public.ecr.aws/lambda/python:3.12

# duckdb 1.4.x has prebuilt manylinux wheels for Python 3.11; 1.3.x is sdist-only.
# `--only-binary=duckdb` forces pip to use the wheel (the AWS Lambda Python image
# has no C++ toolchain, so a source build would fail).
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --only-binary=duckdb \
        "duckdb>=1.4.0,<1.5.0" \
    && pip install --no-cache-dir \
        "boto3>=1.34" \
    && python -c "import duckdb; print('duckdb', duckdb.__version__)"

COPY infra/lambda/armls-parquet-export.py ${LAMBDA_TASK_ROOT}/

CMD ["armls-parquet-export.handler"]
