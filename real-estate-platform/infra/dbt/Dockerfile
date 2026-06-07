# dbt Production Lambda — Python 3.12 + dbt-duckdb + AWS Lambda Power Tools
#
# Per Phase D of docs/superpowers/plans/2026-05-04-execution-playbook.md.
# Builds the container image that the rlsir-analytics-dbt Lambda runs.
#
# Build:
#   docker buildx build --platform linux/amd64 --provenance=false \
#     -f infra/dbt/Dockerfile -t rlsir-analytics-dbt:local .
#
# Smoke (local, no S3 writes):
#   docker run --rm \
#     -e DBT_PROFILES_DIR=/opt/analytics \
#     -e RDS_HOST=dummy -e RDS_PORT=5432 -e RDS_USER=dummy \
#     -e RDS_PASSWORD=dummy -e RDS_DATABASE=dummy \
#     rlsir-analytics-dbt:local \
#     python -c 'from index import handler; print(handler({"task":"smoke"},{}))'

FROM public.ecr.aws/lambda/python:3.12

# Lambda Power Tools first — pulls into the function's runtime cache layer.
RUN pip install --no-cache-dir 'aws-lambda-powertools[tracer,validation]>=2.43,<3'

# dbt-core + dbt-duckdb. Pin to known-good versions per analytics/profiles.yml.
# duckdb >=1.4.0,<1.5.0 because 1.4.x ships manylinux wheels (1.3.x is sdist-only,
# 1.5.x untested with this dbt-duckdb pair).
RUN pip install --no-cache-dir --only-binary=duckdb \
    'duckdb>=1.4.0,<1.5.0' \
    'dbt-core>=1.11,<1.12' \
    'dbt-duckdb>=1.10,<1.11' \
    'cyclonedx-bom>=4.5,<5'

# Project layout. dbt-expectations + dbt_utils + dbt_date come via `dbt deps`
# from analytics/packages.yml — installed at build time so the image has them.
COPY analytics/ /opt/analytics/
RUN cd /opt/analytics && dbt deps --profiles-dir /opt/analytics 2>&1 || \
    (echo "dbt deps failed — likely needs RDS_HOST etc.; fallback to runtime install" && true)
COPY infra/dbt/index.py /var/task/index.py

# Default to running the analytics project from /opt; the handler may chdir.
ENV DBT_PROJECT_DIR=/opt/analytics \
    DBT_PROFILES_DIR=/opt/analytics \
    DBT_TARGET=prod

WORKDIR /opt/analytics

# Lambda runtime invokes index.handler.
CMD [ "index.handler" ]
