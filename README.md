# Validator Script

This validator script is designed to monitor the status of various blockchain services for WAX nodes. It periodically checks specific endpoints for the availability and health of services such as Chain API, History V1, Hyperion, AA API, IPFS, Light API, Github, Seed, and `bp.json`.

## Features

- **Status Monitoring**: The script navigates to specified URLs and extracts the health status of various blockchain services. It checks for the presence of expected elements on the page and determines if each service is healthy or unhealthy based on the color of a button (green for healthy, non-green for unhealthy).
  
- **Metrics Export**: The health statuses are converted into Prometheus metrics. These metrics are then pushed to a Prometheus Pushgateway, allowing you to monitor the health of the services in your Prometheus monitoring setup.

- **Screenshot Capture**: After each check with a failure, the script takes a screenshot of the page (full page) and saves it with a timestamp in `/var/log/validator`. This provides a visual log of the state of the services at each monitoring interval.

## How It Works

1. **Environment Variables**: The script uses environment variables to determine which URLs to monitor for mainnet and testnet (e.g., `GUILD_SITE_LEDGERWISE_MAINNET` and `GUILD_SITE_LEDGERWISE_TESTNET`).

2. **Puppeteer**: Puppeteer is used to launch a headless browser and navigate to the provided URLs. The script waits for specific elements to load and then extracts the status of the services.

3. **Prometheus Metrics**: The extracted statuses are formatted into Prometheus-compliant metrics. For example:
    - `wax_node_main_chain_api_status`
    - `wax_node_main_history_v1_status`
    - `wax_node_main_hyperion_status`
    - And similar metrics for the testnet.

4. **Pushgateway Integration**: These metrics are sent to a Prometheus Pushgateway, allowing you to scrape the status data in your Prometheus monitoring system.

5. **Full-Page Screenshots**: For each monitored URL (mainnet and testnet), the script captures a full-page screenshot of the current state of the website, saved with a timestamp for record-keeping.

## Setup

1. Ensure you have Docker and Docker Compose installed.
2. For monitoring, ensure you have prometheus configured, with a prometheus gateway to push metrics too. (In your **prometheus.yml**, set the following for example)
   ```bash
    - job_name: 'pushgateway'
        static_configs:
        - targets: ['172.168.40.200:9091']

3. Ensure that you environment variables has been defined right for your 3 validators
   ```bash
    - GUILD_SITE_SENTNL=https://wax.sengine.co/guilds/oneinacilian
    - GUILD_SITE_LEDGERWISE_TESTNET=https://nodestatus.ledgerwise.io/wax-test/producer/oneinacilian
    - GUILD_SITE_LEDGERWISE_MAINNET=https://nodestatus.ledgerwise.io/wax/producer/oneinacilian
    - GUILD_SITE_VALIDATIONCORE_TESTNET=https://wax-test.validationcore.io/validations/oneinacilian
    - GUILD_SITE_VALIDATIONCORE_MAINNET=https://wax.validationcore.io/validations/oneinacilian
    - LEDGERWISE_PUSHGATEWAY=http://172.168.40.200:9091/metrics/job/wax_node_status
    - SENTNL_PUSHGATEWAY=http://172.168.40.200:9091/metrics/job/wax_sengine
    - VALIDATIONCORE_PUSHGATEWAY=http://172.168.40.200:9091/metrics/job/wax_validation

4. Optional - Bind your log and screenshot directory
   ```bash
    volumes:
      - /var/log/validator:/var/log/validator  # To persist log files on the host
      - /root/githubtest/websiteinterrogate/composedeploy/validatorchecker/screenshots:/root/githubtest/websiteinterrogate/composedeploy/validatorchecker/screenshots 

5. Build and run validator for sengine, validationcore and ledgerwise
   ```bash
    docker-compose up --build -d
 

