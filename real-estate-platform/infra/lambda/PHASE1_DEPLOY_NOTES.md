# Phase 1 deploy — bronze dual-write

Steps to ship the modified sync Lambda.

## 1. Verify the build compiles

```bash
cd real-estate-platform
node infra/lambda/build.mjs
```

Should produce `infra/lambda/dist/armls-sync.zip` without errors. If esbuild complains about `@aws-sdk/client-s3` not found, the Node 20 Lambda runtime provides it; verify the externalization was added in `build.mjs`.

## 2. Attach the IAM policy

The sync Lambda's existing execution role is `rlsir-token-refresh-role` (legacy name, current role). Attach the bronze-write policy:

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" iam put-role-policy \
  --role-name rlsir-token-refresh-role \
  --policy-name rlsir-bronze-write \
  --policy-document file://infra/lambda/iam-bronze-write-policy.json \
  --region us-east-1
```

**This is an AWS WRITE op** — confirm with Joey before running per CLAUDE.md.

Verify:
```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" iam list-role-policies --role-name rlsir-token-refresh-role
# expect: rlsir-bronze-write to appear in the list
```

## 3. Deploy the modified Lambda code

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda update-function-code \
  --function-name rlsir-armls-sync \
  --zip-file fileb://infra/lambda/dist/armls-sync.zip \
  --region us-east-1
```

**This is an AWS WRITE op** — confirm with Joey before running.

## 4. Smoke test with one invocation

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda invoke \
  --function-name rlsir-armls-sync \
  --payload '{"task":"sync-active"}' \
  --cli-binary-format raw-in-base64-out \
  --region us-east-1 \
  /tmp/sync-test-output.json

cat /tmp/sync-test-output.json
```

## 5. Verify bronze landed on S3

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" s3 ls \
  s3://rlsir-platform-assets-us-east-1/bronze/listings/ \
  --recursive --human-readable | tail -20
```

Should see `sync_year=2026/sync_month=04/sync_day=28/run_id=<uuid>/page_0000.ndjson.gz` files.

## 6. Read one back via DuckDB to verify content

```bash
python -c "
import duckdb
con = duckdb.connect(':memory:')
con.execute(\"INSTALL httpfs; LOAD httpfs; SET s3_region='us-east-1'\")
# AWS creds read from default chain (IAM if running on EC2/Lambda, ~/.aws if local)
n = con.execute(\"\"\"
  SELECT COUNT(*) AS rows,
         COUNT(DISTINCT ListingKey) AS distinct_listings
  FROM read_json_auto('s3://rlsir-platform-assets-us-east-1/bronze/listings/**/*.ndjson.gz')
\"\"\").fetchone()
print(f'rows: {n[0]:,}, distinct: {n[1]:,}')
"
```

## 7. CloudWatch verification

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" logs tail \
  /aws/lambda/rlsir-armls-sync \
  --since 5m \
  --region us-east-1 | grep -i "bronze\|skiptoken"
```

Look for: `bronze N pages, X.XX MB` in the checkpoint logs.

## Rollback

If anything misbehaves:

```bash
# Revert the Lambda code to the previous version
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda update-function-code \
  --function-name rlsir-armls-sync \
  --zip-file fileb://infra/lambda/dist/armls-sync.zip.previous \
  --region us-east-1

# Or, faster: revert just the bronze write by setting the env var
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda update-function-configuration \
  --function-name rlsir-armls-sync \
  --environment "Variables={BRONZE_DISABLED=true}" \
  --region us-east-1
```

**Note:** the `BRONZE_DISABLED` flag is not currently checked by `bronze-writer.ts`. If we need it, add a guard in `writeBronzePage()`:

```ts
if (process.env.BRONZE_DISABLED === 'true') {
  return { ok: true, recordCount: 0 };
}
```

## Validation gates before Phase 2

- [ ] One full sync cycle completes without errors
- [ ] CloudWatch shows `bronze N pages, X.XX MB` for every checkpoint
- [ ] S3 `bronze/listings/` prefix has expected files
- [ ] DuckDB can read at least one page back
- [ ] Postgres `listing_records` row count unchanged (legacy path still working)
- [ ] No new Lambda errors in CloudWatch for 24 h after deploy
