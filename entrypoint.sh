#!/bin/sh

# Infinite loop to run the scripts every minute
while true; do
  echo "Running fetch_chain_api_ledger.js at $(date)" >> /var/log/validator/ledger_cron.log
  /usr/local/bin/node /app/fetch_chain_api_ledger.js >> /var/log/validator/ledger_cron.log 2>&1

  echo "Running fetch_chain_api_validationcore.js at $(date)" >> /var/log/validator/validationcore_cron.log
  /usr/local/bin/node /app/fetch_chain_api_validationcore.js >> /var/log/validator/validationcore_cron.log 2>&1

  echo "Running fetch_chain_api_sentnl.js at $(date)" >> /var/log/validator/sentnl_cron.log
  /usr/local/bin/node /app/fetch_chain_api_sentnl.js >> /var/log/validator/sentnl_cron.log 2>&1

  # Wait for 60 seconds before running again
  sleep 60
done
