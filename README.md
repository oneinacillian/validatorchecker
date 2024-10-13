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
   ```
   Environment variables used to switch screenshotting on/off
   ```bash
   - VALIDATIONCORE_ENABLE_SCREENSHOT=false
   - SENTNL_ENABLE_SCREENSHOT=false
   - LEDGERWISE_ENABLE_SCREENSHOT=false   
   ```
   Screenshot path environment (if you want to map it to your host, remember the host binding)
   ```bash
   - SCREENSHOT_PATH=/root/githubtest/websiteinterrogate/composedeploy/validatorchecker/screenshots
   ```

5. Build and run validator for sengine, validationcore and ledgerwise
   ```bash
    docker-compose up --build -d
   ``` 


 ## Examples

1. Log files created but validator app
   ```bash
   ls /var/log/validator/
   ledger_cron.log  sentnl_cron.log  validationcore_cron.log
   ```
   ```bash
    cat /var/log/validator/ledger_cron.log 
    Running fetch_chain_api_ledger.js at Sun Oct 13 15:21:01 UTC 2024
    API URL: https://nodestatus.ledgerwise.io/wax-test/producer/oneinacilian
    API URL: https://nodestatus.ledgerwise.io/wax/producer/oneinacilian
    API URL: http://172.168.40.200:9091/metrics/job/wax_node_status
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
    Running fetch_chain_api_ledger.js at Sun Oct 13 15:23:06 UTC 2024
    API URL: https://nodestatus.ledgerwise.io/wax-test/producer/oneinacilian
    API URL: https://nodestatus.ledgerwise.io/wax/producer/oneinacilian
    API URL: http://172.168.40.200:9091/metrics/job/wax_node_status
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
    Running fetch_chain_api_ledger.js at Sun Oct 13 15:25:46 UTC 2024
    API URL: https://nodestatus.ledgerwise.io/wax-test/producer/oneinacilian
    API URL: https://nodestatus.ledgerwise.io/wax/producer/oneinacilian
    API URL: http://172.168.40.200:9091/metrics/job/wax_node_status
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
   ```
   ```bash
    cat /var/log/validator/sentnl_cron.log 
    Running fetch_chain_api_sentnl.js at Sun Oct 13 15:21:59 UTC 2024
    API URL: https://wax.sengine.co/guilds/oneinacilian
    Metrics for sengine successfully sent to Pushgateway.
    Running fetch_chain_api_sentnl.js at Sun Oct 13 15:24:39 UTC 2024
    API URL: https://wax.sengine.co/guilds/oneinacilian
    Metrics for sengine successfully sent to Pushgateway.
    Running fetch_chain_api_sentnl.js at Sun Oct 13 15:26:45 UTC 2024
    API URL: https://wax.sengine.co/guilds/oneinacilian
    Metrics for sengine successfully sent to Pushgateway.
   ```
   ```bash
    Running fetch_chain_api_validationcore.js at Sun Oct 13 15:35:02 UTC 2024
    API URL: https://wax-test.validationcore.io/validations/oneinacilian
    API URL: https://wax.validationcore.io/validations/oneinacilian
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
    Running fetch_chain_api_validationcore.js at Sun Oct 13 15:37:07 UTC 2024
    API URL: https://wax-test.validationcore.io/validations/oneinacilian
    API URL: https://wax.validationcore.io/validations/oneinacilian
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
    Running fetch_chain_api_validationcore.js at Sun Oct 13 15:39:26 UTC 2024
    API URL: https://wax-test.validationcore.io/validations/oneinacilian
    API URL: https://wax.validationcore.io/validations/oneinacilian
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
    Running fetch_chain_api_validationcore.js at Sun Oct 13 15:41:40 UTC 2024
    API URL: https://wax-test.validationcore.io/validations/oneinacilian
    API URL: https://wax.validationcore.io/validations/oneinacilian
    Metrics for main successfully sent to Pushgateway.
    Metrics for test successfully sent to Pushgateway.
    Running fetch_chain_api_validationcore.js at Sun Oct 13 15:43:45 UTC 2024
    API URL: https://wax-test.validationcore.io/validations/oneinacilian
    API URL: https://wax.validationcore.io/validations/oneinacilian
   ```

2. Some screenshots:
   [LedgerWise TestNet](assets/test-ledgerwise-2024-10-13T16-34-24-011Z.png)</br>
   [LedgerWise MainNet](assets/main-ledgerwise-2024-10-13T16-34-19-659Z.png)</br>   
   [ValidationCore TestNet](assets/test-validationcore-2024-10-13T16-35-03-985Z.png)</br>  
   [ValidationCore MainNet](assets/main-validationcore-2024-10-13T16-34-45-878Z.png)</br>   
   [Sengine](assets/sengine-sentnl-2024-10-13T16-35-12-960Z.png)</br>
   [Prometheus Monitor Example](assets/screenshot-monitor-view.png)</br>

   
   > *You can handle the screenshots in the bind mount of the docker compose any way you want and use it for either telegram alerting or e-mail*

3. Exposed metrics by pushgateway (you can configure grafana alerting on these you want to monitor)
   ```bash
   # TYPE wax_node_aa_api_status untyped
   wax_node_aa_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_bp_json_status untyped
   wax_node_bp_json_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_chain_api_status untyped
   wax_node_chain_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_github_status untyped
   wax_node_github_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_history_v1_status untyped
   wax_node_history_v1_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_hyperion_status untyped
   wax_node_hyperion_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_ipfs_status untyped
   wax_node_ipfs_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_light_api_status untyped
   wax_node_light_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_aa_api_status untyped
   wax_node_main_aa_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_bp_json_status untyped
   wax_node_main_bp_json_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_chain_api_status untyped
   wax_node_main_chain_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_github_status untyped
   wax_node_main_github_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_history_v1_status untyped
   wax_node_main_history_v1_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_hyperion_status untyped
   wax_node_main_hyperion_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_ipfs_status untyped
   wax_node_main_ipfs_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_light_api_status untyped
   wax_node_main_light_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_main_seed_status untyped
   wax_node_main_seed_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_seed_status untyped
   wax_node_seed_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_test_aa_api_status untyped
   wax_node_test_aa_api_status{instance="",job="wax_node_status"} 0
   # TYPE wax_node_test_bp_json_status untyped
   wax_node_test_bp_json_status{instance="",job="wax_node_status"} 0
   # TYPE wax_node_test_chain_api_status untyped
   wax_node_test_chain_api_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_test_github_status untyped
   wax_node_test_github_status{instance="",job="wax_node_status"} 0
   # TYPE wax_node_test_history_v1_status untyped
   wax_node_test_history_v1_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_test_hyperion_status untyped
   wax_node_test_hyperion_status{instance="",job="wax_node_status"} 1
   # TYPE wax_node_test_ipfs_status untyped
   wax_node_test_ipfs_status{instance="",job="wax_node_status"} 0
   # TYPE wax_node_test_light_api_status untyped
   wax_node_test_light_api_status{instance="",job="wax_node_status"} 0
   # TYPE wax_node_test_seed_status untyped
   wax_node_test_seed_status{instance="",job="wax_node_status"} 1
   # TYPE wax_sengine_sengine_atomic_api_status untyped
   wax_sengine_sengine_atomic_api_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_cors_check_status untyped
   wax_sengine_sengine_cors_check_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_history_v1_status untyped
   wax_sengine_sengine_history_v1_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_hyperion_testnet_full_status untyped
   wax_sengine_sengine_hyperion_testnet_full_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_hyperion_testnet_status untyped
   wax_sengine_sengine_hyperion_testnet_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_hyperion_v2_full_status untyped
   wax_sengine_sengine_hyperion_v2_full_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_hyperion_v2_status untyped
   wax_sengine_sengine_hyperion_v2_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_oracle_feed_status untyped
   wax_sengine_sengine_oracle_feed_status{instance="",job="wax_sengine"} 1
   # TYPE wax_sengine_sengine_wwwjson_status untyped
   wax_sengine_sengine_wwwjson_status{instance="",job="wax_sengine"} 1
   # TYPE wax_validation_main_api_status untyped
   wax_validation_main_api_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_main_atomic_status untyped
   wax_validation_main_atomic_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_main_history_status untyped
   wax_validation_main_history_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_main_hyperion_status untyped
   wax_validation_main_hyperion_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_main_seed_status untyped
   wax_validation_main_seed_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_test_api_status untyped
   wax_validation_test_api_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_test_atomic_status untyped
   wax_validation_test_atomic_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_test_history_status untyped
   wax_validation_test_history_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_test_hyperion_status untyped
   wax_validation_test_hyperion_status{instance="",job="wax_validation"} 1
   # TYPE wax_validation_test_seed_status untyped
   wax_validation_test_seed_status{instance="",job="wax_validation"} 1
   ``` 

