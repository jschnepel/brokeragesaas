# Phase 2 deploy — bronze reconciliation + alarms

Steps to ship the daily reconcile Lambda + CloudWatch alarms + SNS topic.
Each command is an **AWS write op** — confirm with Joey before running per CLAUDE.md.

## 1. Create SNS topic for pipeline alerts

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" sns create-topic \
  --name rlsir-data-pipeline-alerts \
  --region us-east-1 \
  --query "TopicArn" --output text
# Returns: arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts
```

Subscribe email:

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts \
  --protocol email \
  --notification-endpoint joeyschnepel@gmail.com \
  --region us-east-1
```

Confirm via the email Amazon sends.

## 2. Create DynamoDB state table

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" dynamodb create-table \
  --table-name rlsir-bronze-reconcile-state \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## 3. Add IAM permissions to the existing role

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" iam put-role-policy \
  --role-name rlsir-token-refresh-role \
  --policy-name rlsir-reconcile-permissions \
  --policy-document file://"C:/Users/joeys/Desktop/RLSIR Websites/real-estate-platform/infra/lambda/iam-reconcile-policy.json" \
  --region us-east-1
```

(Policy file written below — see `iam-reconcile-policy.json`.)

## 4. Create the bronze-reconcile Lambda

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda create-function \
  --function-name rlsir-bronze-reconcile \
  --runtime nodejs20.x \
  --role arn:aws:iam::828301486081:role/rlsir-token-refresh-role \
  --handler bronze-reconcile.handler \
  --timeout 300 \
  --memory-size 256 \
  --zip-file fileb://"C:/Users/joeys/Desktop/RLSIR Websites/real-estate-platform/infra/lambda/dist/bronze-reconcile.zip" \
  --environment "Variables={SNS_TOPIC_ARN=arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts,STATE_TABLE=rlsir-bronze-reconcile-state,RDS_DSN_SECRET=rlsir/db/url}" \
  --region us-east-1 \
  --query "{State:State,FunctionArn:FunctionArn}" \
  --output json
```

## 5. Create EventBridge schedule (daily 04:00 PHX = 11:00 UTC)

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" events put-rule \
  --name rlsir-bronze-reconcile-schedule \
  --schedule-expression "cron(0 11 * * ? *)" \
  --state ENABLED \
  --region us-east-1

"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda add-permission \
  --function-name rlsir-bronze-reconcile \
  --statement-id eventbridge-invoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:828301486081:rule/rlsir-bronze-reconcile-schedule \
  --region us-east-1

"C:/Program Files/Amazon/AWSCLIV2/aws.exe" events put-targets \
  --rule rlsir-bronze-reconcile-schedule \
  --targets "Id=1,Arn=arn:aws:lambda:us-east-1:828301486081:function:rlsir-bronze-reconcile" \
  --region us-east-1
```

## 6. Smoke test

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" lambda invoke \
  --function-name rlsir-bronze-reconcile \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  --region us-east-1 \
  /tmp/reconcile-test.json

cat /tmp/reconcile-test.json
# expect: {"date":"2026-04-28","bronze_rows":...,"pg_rows":...,"delta":...}
```

## 7. Create the 9 alarms from §11.0 of master plan

```bash
# 1. sync-stale (bronze freshness)
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" cloudwatch put-metric-alarm \
  --alarm-name rlsir-bronze-stale \
  --metric-name BronzeRowCount --namespace RLSIR/DataPipeline \
  --statistic Sum --period 86400 --evaluation-periods 1 \
  --threshold 1 --comparison-operator LessThanThreshold \
  --treat-missing-data breaching \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts \
  --region us-east-1

# 2. dbt-build-failed (will arm in Phase 4 once dbt Lambda exists)
# 3. dbt-build-slow (Phase 4)

# 4. query-lambda-slow (Phase 5 once DuckDB analytics Lambda exists)
# 5. query-lambda-errors (Phase 5)

# 6. s3-cost-spike — AWS Budgets alert
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" budgets create-budget \
  --account-id 828301486081 \
  --budget '{"BudgetName":"rlsir-s3-daily","BudgetLimit":{"Amount":"1.00","Unit":"USD"},"TimeUnit":"DAILY","BudgetType":"COST","CostFilters":{"Service":["Amazon Simple Storage Service"]}}' \
  --notifications-with-subscribers '[{"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":100},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"joeyschnepel@gmail.com"}]}]' \
  --region us-east-1

# 7. rds-cpu
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" cloudwatch put-metric-alarm \
  --alarm-name rlsir-rds-cpu-high \
  --metric-name CPUUtilization --namespace AWS/RDS \
  --dimensions Name=DBInstanceIdentifier,Value=rlsir-db \
  --statistic Average --period 900 --evaluation-periods 1 \
  --threshold 80 --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts \
  --region us-east-1

# 8. rds-connections
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" cloudwatch put-metric-alarm \
  --alarm-name rlsir-rds-connections-high \
  --metric-name DatabaseConnections --namespace AWS/RDS \
  --dimensions Name=DBInstanceIdentifier,Value=rlsir-db \
  --statistic Average --period 300 --evaluation-periods 1 \
  --threshold 4 --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts \
  --region us-east-1

# 9. reconciliation-drift (the one this Lambda directly powers)
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" cloudwatch put-metric-alarm \
  --alarm-name rlsir-reconcile-drift \
  --metric-name BronzeReconciliationAbsDelta --namespace RLSIR/DataPipeline \
  --statistic Maximum --period 86400 --evaluation-periods 3 \
  --threshold 5 --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts \
  --region us-east-1
```

## Validation (after Day 1)

- [ ] Reconcile Lambda invoked successfully at 04:00 PHX
- [ ] CloudWatch metric `BronzeReconciliationDelta` published
- [ ] DynamoDB `rlsir-bronze-reconcile-state` has a `drift_counter` row
- [ ] No SNS alert fired (since drift should be 0 on day 1)
- [ ] Email subscription confirmed

## Validation gates for promoting bronze (Phase 2 → Phase 3)

After **7 consecutive days**:
- [ ] Reconcile Lambda has invoked successfully each day
- [ ] `BronzeReconciliationAbsDelta` ≤ 5 each day
- [ ] DynamoDB drift_counter never exceeded 2 days

If all pass, proceed to Phase 3 (backfill).
