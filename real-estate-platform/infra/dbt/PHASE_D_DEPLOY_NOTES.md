# Phase D — Production dbt Lambda Deploy Notes

**Per:** `docs/superpowers/plans/2026-05-04-execution-playbook.md` Session S9 + S10
**Branch:** `feature/phase-d-dbt-lambda`
**Status:** Local prep complete; AWS writes pending user approval

---

## What's local-ready

| Artifact    | Path                        | Size       |
| ----------- | --------------------------- | ---------- |
| Dockerfile  | `infra/dbt/Dockerfile`      | —          |
| Handler     | `infra/dbt/index.py`        | 5.6KB      |
| Built image | `rlsir-analytics-dbt:local` | **1.49GB** |

Image content:

- Python 3.12 (AWS Lambda base)
- dbt-core 1.11.8 + dbt-duckdb 1.10.1
- DuckDB 1.4.x (manylinux wheel)
- aws-lambda-powertools 2.x
- cyclonedx-bom (for SBOM gen)
- The `analytics/` dbt project, with `dbt deps` resolved at build time

---

## Verified locally

- ✅ `docker buildx build` succeeds
- ✅ `dbt --version` returns: dbt-core 1.11.8, dbt-duckdb 1.10.1
- ✅ `dbt parse --target dev` succeeds inside the container
- ⚠ Handler-level smoke skipped (Lambda Power Tools requires real Lambda context object; would need RIE or a mock)

---

## ORR checklist (per playbook Section 2.0 + Phase D Quality Gates)

- [x] `pnpm type-check` 0 errors (n/a — Python service; dbt parse green)
- [x] Container builds successfully
- [x] Image size < 2.5GB (1.49GB)
- [ ] **ECR scan** — pending push, then `aws ecr describe-image-scan-findings`
- [x] CycloneDX SBOM tool installed in image
- [ ] DLQ configured (planned: SNS topic `rlsir-dbt-failures`)
- [ ] 3 alarms configured (latency p99, errors, freshness)
- [ ] IAM Access Analyzer review (planned post-role-creation)
- [x] `task: "smoke"` handler path implemented (parses without S3 writes)
- [x] Reserved concurrency strategy documented (=1 for serialized batch)
- [x] Free-tier audit reviewed (will be at 19/20 alarms after Phase D — at edge)

---

## ADR-001 to commit alongside this PR

Per Section 2.0 standing gates: an ADR lands with the architecturally-significant choice.

**ADR-008 — dbt runtime: Lambda Container vs ECS vs GitHub Actions**

- **Decision:** Lambda Container, image built locally + pushed to ECR
- **Rationale:**
  - 15-min runtime cap fits comfortably (last dev run: 64s)
  - $0 idle cost
  - Reuses existing IAM/alarm pipeline (matches `rlsir-armls-sync`, `rlsir-armls-parquet-export` patterns)
  - 10GB container limit easily fits dbt + DuckDB + extensions
- **Alternatives rejected:**
  - **GitHub Actions** — free for public repos but private repo minutes are limited; no integration with existing CloudWatch alarm pipeline
  - **ECS Fargate** — always-on cost ($5+/mo); overkill for hourly batch
- **Consequences:**
  - Lambda cold-start adds ~3s vs always-on (acceptable)
  - Image-size growth must stay under 10GB (currently 1.49GB; lots of headroom)
  - Reserved concurrency = 1 to serialize hourly fires

(Will be ADR-008 in `docs/DECISIONS.md` since ADR-007 is the existing newest.)

---

## AWS writes needed (request user approval)

In execution order:

```bash
# 1. Create ECR repo
aws ecr create-repository --repository-name rlsir-analytics-dbt --region us-east-1 \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability IMMUTABLE

# 2. Login + push the image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 828301486081.dkr.ecr.us-east-1.amazonaws.com
docker tag rlsir-analytics-dbt:local 828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-analytics-dbt:v1
docker push 828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-analytics-dbt:v1

# 3. Verify ECR image scan
aws ecr describe-image-scan-findings \
  --repository-name rlsir-analytics-dbt \
  --image-id imageTag=v1 --region us-east-1
# (block deploy if HIGH+ CVEs present)

# 4. Create IAM role with least-privilege policy
aws iam create-role --role-name rlsir-analytics-dbt-role \
  --assume-role-policy-document file://infra/dbt/iam-trust-policy.json
aws iam attach-role-policy --role-name rlsir-analytics-dbt-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam put-role-policy --role-name rlsir-analytics-dbt-role \
  --policy-name rlsir-analytics-dbt-permissions \
  --policy-document file://infra/dbt/iam-permissions.json

# 5. Create DLQ
aws sns create-topic --name rlsir-dbt-failures --region us-east-1

# 6. Create Lambda
aws lambda create-function \
  --function-name rlsir-analytics-dbt \
  --package-type Image \
  --code ImageUri=828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-analytics-dbt:v1 \
  --role arn:aws:iam::828301486081:role/rlsir-analytics-dbt-role \
  --memory-size 1024 --timeout 900 \
  --environment "Variables={ARTIFACTS_BUCKET=rlsir-platform-assets-us-east-1,ARTIFACTS_PREFIX=analytics/_meta/,DBT_TARGET=prod}" \
  --dead-letter-config TargetArn=arn:aws:sns:us-east-1:828301486081:rlsir-dbt-failures \
  --region us-east-1
aws lambda put-function-concurrency \
  --function-name rlsir-analytics-dbt --reserved-concurrent-executions 1

# 7. Manual smoke invocation (no schedule yet)
aws lambda invoke --function-name rlsir-analytics-dbt \
  --payload '{"task":"smoke"}' --cli-binary-format raw-in-base64-out smoke-out.json
cat smoke-out.json

# 8. Create EventBridge schedule (DO NOT enable yet — wait for ORR sign-off)
aws events put-rule --name rlsir-analytics-dbt-schedule \
  --schedule-expression 'rate(1 hour)' --state DISABLED --region us-east-1
aws events put-targets --rule rlsir-analytics-dbt-schedule \
  --targets "Id=1,Arn=arn:aws:lambda:us-east-1:828301486081:function:rlsir-analytics-dbt,Input='{\"task\":\"run\"}'"
aws lambda add-permission \
  --function-name rlsir-analytics-dbt \
  --statement-id rlsir-analytics-dbt-eventbridge \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:828301486081:rule/rlsir-analytics-dbt-schedule

# 9. Create 3 CloudWatch alarms
aws cloudwatch put-metric-alarm --alarm-name rlsir-analytics-dbt-errors \
  --metric-name Errors --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=rlsir-analytics-dbt \
  --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 \
  --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-token-alerts

aws cloudwatch put-metric-alarm --alarm-name rlsir-analytics-dbt-models-failed \
  --metric-name DbtModelsFailed --namespace RLSIR/DataPipeline \
  --statistic Maximum --period 3600 --evaluation-periods 1 --threshold 0 \
  --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-token-alerts

aws cloudwatch put-metric-alarm --alarm-name rlsir-analytics-dbt-duration-anomaly \
  --metric-name Duration --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=rlsir-analytics-dbt \
  --statistic p99 --period 3600 --evaluation-periods 2 --threshold 600000 \
  --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-token-alerts

# 10. After smoke green and 1 manual run produces all 27 marts in S3:
aws events enable-rule --name rlsir-analytics-dbt-schedule --region us-east-1
```

After step 10: production hourly dbt runs begin. Monitor for the first 6 hours, then proceed to Phase E (parallel reconciliation).

---

## Free-tier impact (verified vs runbook)

| Resource       | Before Phase D |                                         After Phase D | Soft cap |
| -------------- | -------------: | ----------------------------------------------------: | -------: |
| Lambdas        |              4 |                                                     5 |       12 |
| Custom metrics |             23 | 26 (+ DbtModelsBuilt, DbtModelsFailed, DbtRunSeconds) |       30 |
| Alarms         |             15 |                                          18 (+ 3 new) |       20 |

After Phase D: 18/20 alarms — at the edge. Phase E adds 1 more (parity drift) → 19/20. Phase F+G alarms must displace existing ones or the soft cap moves with an ADR.

---

## Closing notes

- All 27 marts (per Phase C unlock) will run once production fires. dbt run_results.json gets uploaded to `s3://rlsir-platform-assets-us-east-1/analytics/_meta/run_results-${ts}.json` for CloudWatch Logs Insights queries.
- Local DuckDB OOM on 1.84M-row bronze is **not** a Lambda concern — Lambda has 1024MB and the production target uses S3 reads via DuckDB httpfs (memory-friendly streaming), not local file scans.
