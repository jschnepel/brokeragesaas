#!/usr/bin/env bash
# provision-lambda.sh — Deploy ARMLS sync Lambda + EventBridge schedule
#
# Prerequisites:
#   1. AWS CLI configured (profile: default, region: us-east-1)
#   2. Lambda bundle built: node infra/lambda/build.mjs
#   3. SSM params set: /rlsir/spark-access-token, /rlsir/spark-refresh-token, etc.
#
# Usage: MSYS_NO_PATHCONV=1 bash infra/provision-lambda.sh
#
# This script is IDEMPOTENT — safe to re-run.

set -euo pipefail

AWS="C:/Program Files/Amazon/AWSCLIV2/aws.exe"
REGION="us-east-1"
ACCOUNT_ID="828301486081"

FUNCTION_NAME="rlsir-armls-sync"
ROLE_NAME="rlsir-armls-sync-role"
RULE_NAME="rlsir-armls-sync-schedule"
ZIP_FILE="infra/lambda/dist/armls-sync.zip"

# RDS connection (fetched from SSM in Lambda via env vars)
RDS_URL_SSM="/rlsir/rds-database-url"

echo "=== ARMLS Sync Lambda Deployment ==="
echo "Region: $REGION"
echo "Function: $FUNCTION_NAME"
echo ""

# ─── Step 1: IAM Role ───────────────────────────────────────────────
echo "Step 1: IAM Role..."

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

ROLE_ARN=$("$AWS" iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)

if [ -z "$ROLE_ARN" ] || [ "$ROLE_ARN" = "None" ]; then
  echo "  Creating IAM role: $ROLE_NAME"
  ROLE_ARN=$("$AWS" iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --query 'Role.Arn' --output text)

  # Attach basic Lambda execution policy
  "$AWS" iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

  # Attach VPC access (for RDS)
  "$AWS" iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"

  # SSM read access for secrets
  "$AWS" iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "ssm-read" \
    --policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": ["ssm:GetParameter", "ssm:GetParameters"],
        "Resource": "arn:aws:ssm:us-east-1:828301486081:parameter/rlsir/*"
      }]
    }'

  echo "  Waiting 10s for IAM propagation..."
  sleep 10
else
  echo "  Role exists: $ROLE_ARN"
fi

echo "  Role ARN: $ROLE_ARN"

# ─── Step 2: Lambda Function ────────────────────────────────────────
echo ""
echo "Step 2: Lambda Function..."

if ! [ -f "$ZIP_FILE" ]; then
  echo "  ERROR: $ZIP_FILE not found. Run: node infra/lambda/build.mjs"
  exit 1
fi

ENV_VARS="{
  \"Variables\": {
    \"RDS_DATABASE_URL_SSM\": \"$RDS_URL_SSM\",
    \"SPARK_ACCESS_TOKEN_SSM\": \"/rlsir/spark-access-token\",
    \"SPARK_REFRESH_TOKEN_SSM\": \"/rlsir/spark-refresh-token\",
    \"SPARK_OAUTH_KEY_SSM\": \"/rlsir/spark-oauth-key\",
    \"SPARK_OAUTH_SECRET_SSM\": \"/rlsir/spark-oauth-secret\",
    \"NODE_ENV\": \"production\"
  }
}"

EXISTING=$("$AWS" lambda get-function --function-name "$FUNCTION_NAME" 2>/dev/null || true)

if [ -z "$EXISTING" ]; then
  echo "  Creating Lambda function: $FUNCTION_NAME"
  "$AWS" lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "nodejs20.x" \
    --role "$ROLE_ARN" \
    --handler "index.handler" \
    --zip-file "fileb://$ZIP_FILE" \
    --timeout 900 \
    --memory-size 512 \
    --environment "$ENV_VARS" \
    --description "ARMLS Spark replication sync — runs every 4 hours" \
    --query 'FunctionArn' --output text
else
  echo "  Updating Lambda function code..."
  "$AWS" lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --query 'FunctionArn' --output text

  echo "  Updating Lambda function configuration..."
  "$AWS" lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --timeout 900 \
    --memory-size 512 \
    --environment "$ENV_VARS" \
    --query 'FunctionArn' --output text
fi

echo "  Lambda ready."

# ─── Step 3: EventBridge Rule ────────────────────────────────────────
echo ""
echo "Step 3: EventBridge Schedule..."

RULE_ARN=$("$AWS" events describe-rule --name "$RULE_NAME" --query 'Arn' --output text 2>/dev/null || true)

if [ -z "$RULE_ARN" ] || [ "$RULE_ARN" = "None" ]; then
  echo "  Creating EventBridge rule: $RULE_NAME (every 4 hours)"
  RULE_ARN=$("$AWS" events put-rule \
    --name "$RULE_NAME" \
    --schedule-expression "rate(4 hours)" \
    --state ENABLED \
    --description "Trigger ARMLS sync Lambda every 4 hours" \
    --query 'RuleArn' --output text)

  # Add Lambda as target
  "$AWS" events put-targets \
    --rule "$RULE_NAME" \
    --targets "Id=armls-sync-target,Arn=arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"

  # Grant EventBridge permission to invoke Lambda
  "$AWS" lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "eventbridge-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "events.amazonaws.com" \
    --source-arn "$RULE_ARN" 2>/dev/null || true
else
  echo "  Rule exists: $RULE_ARN"
fi

# ─── Step 4: Verify ─────────────────────────────────────────────────
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Lambda:      $FUNCTION_NAME"
echo "Role:        $ROLE_NAME"
echo "Schedule:    every 4 hours ($RULE_NAME)"
echo "ZIP:         $ZIP_FILE"
echo ""
echo "To test manually:"
echo "  MSYS_NO_PATHCONV=1 \"$AWS\" lambda invoke --function-name $FUNCTION_NAME --payload '{}' /tmp/sync-result.json && cat /tmp/sync-result.json"
echo ""
echo "To check logs:"
echo "  MSYS_NO_PATHCONV=1 \"$AWS\" logs tail /aws/lambda/$FUNCTION_NAME --follow"
