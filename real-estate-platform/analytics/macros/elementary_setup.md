# Elementary Data — installation + usage

## What it adds

- **Test result history** — every `dbt test` run persists results to a DuckDB table
- **Anomaly detection** — `dbt run-operation elementary.run_anomaly_tests` flags metrics that drift outside expected ranges
- **HTML report** — `edr report` generates lineage + test history dashboard
- **Slack/email alerts** — `edr monitor` sends notifications on test failures + anomalies

## Setup (already in `packages.yml`)

```yaml
packages:
  - package: elementary-data/elementary
    version: [">=0.16.0", "<1.0.0"]
```

```bash
dbt deps                                     # installs Elementary
dbt run -s elementary --target dev           # creates Elementary tables in DuckDB
```

## Configure on-run-end hook (already in `dbt_project.yml`)

```yaml
on-run-end:
  - "{{ elementary.elementary_run_end_hook() }}"
```

## Generate the HTML report

```bash
pip install elementary-data
edr report --target dev
# Opens edr_target/elementary_report.html
```

Upload to S3 and serve via CloudFront alongside `dbt docs`:

```bash
aws s3 cp edr_target/elementary_report.html \
  s3://rlsir-platform-assets-us-east-1/analytics/_docs/elementary.html \
  --cache-control "max-age=600"
```

## Anomaly detection — set per-mart

In each mart `.yml`, mark which metrics to anomaly-track:

```yaml
models:
  - name: fct_market_pulse
    config:
      meta:
        elementary:
          anomaly_detection_metrics:
            - closing_count
            - median_close
```

Then schedule `dbt run-operation elementary.run_anomaly_tests --target prod` daily.
Alerts publish to the SNS topic via the existing alarm wiring.

## Slack/email alerts

```bash
# In dbt_project.yml or via CLI:
edr monitor --slack-channel '#data-pipeline'    # or
edr monitor --slack-webhook $SLACK_WEBHOOK_URL  # or
edr monitor --email joeyschnepel@gmail.com
```

For our setup, route via SNS instead:

```bash
edr monitor --aws-sns-topic arn:aws:sns:us-east-1:828301486081:rlsir-data-pipeline-alerts
```
