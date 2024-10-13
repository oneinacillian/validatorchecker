const puppeteer = require('puppeteer');
const axios = require('axios');
const apiUrl_test = process.env.GUILD_SITE_LEDGERWISE_TESTNET;
const apiUrl_main = process.env.GUILD_SITE_LEDGERWISE_MAINNET;

console.log("API URL:", apiUrl_test);  // Check if API_URL is correctly passed
console.log("API URL:", apiUrl_main);  // Check if API_URL is correctly passed

if (!apiUrl_test) {
  throw new Error("API_URL environment variable is missing");
}

if (!apiUrl_main) {
    throw new Error("API_URL environment variable is missing");
  }

(async () => {
    const PUSHGATEWAY_URL = "http://172.168.40.200:9091/metrics/job/wax_node_status";

    // Launch a headless browser with the necessary flags
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Function to extract status based on the button background color
    const extractValues = async (page) => {
        return await page.evaluate(() => {
            // Corrected selector with escaped square brackets
            const elements = document.querySelectorAll('.flex.flex-col.items-center.max-w-\\[128px\\].justify-center.relative');
            let chainApiValue = null;
            let historyV1Value = null;
            let hyperionValue = null;
            let aaApiValue = null;
            let ipfsValue = null;
            let lightApiValue = null;
            let githubValue = null;
            let seedValue = null;
            let bpJsonValue = null;

            const getStatus = (buttonStyle) => {
                // Check if the button background is green (healthy)
                const healthyColor = 'rgb(4, 175, 125)';
                const unavailableColor = 'rgb(72, 79, 88)'; // Skip monitoring if the button is gray

                if (buttonStyle.includes(unavailableColor)) {
                    return null; // Skip monitoring this element
                } else if (buttonStyle.includes(healthyColor)) {
                    return '100.00% OK'; // Consider green as healthy
                } else {
                    return 'Unhealthy'; // Any other color is unhealthy
                }
            };

            elements.forEach((element) => {
                const button = element.querySelector('button');
                const statusText = element.querySelector('p.text-sm.font-medium.text-accent-gray-200.text-center.mb-1');

                if (button && statusText) {
                    const buttonStyle = button.getAttribute('style');
                    const statusValue = getStatus(buttonStyle);

                    if (statusText.textContent.includes("Chain API")) {
                        chainApiValue = statusValue;
                    } else if (statusText.textContent.includes("History V1")) {
                        historyV1Value = statusValue;
                    } else if (statusText.textContent.includes("Hyperion")) {
                        hyperionValue = statusValue;
                    } else if (statusText.textContent.includes("AA API")) {
                        aaApiValue = statusValue;
                    } else if (statusText.textContent.includes("IPFS")) {
                        ipfsValue = statusValue;
                    } else if (statusText.textContent.includes("Light API")) {
                        lightApiValue = statusValue;
                    } else if (statusText.textContent.includes("Github")) {
                        githubValue = statusValue;
                    } else if (statusText.textContent.includes("Seed")) {
                        seedValue = statusValue;
                    } else if (statusText.textContent.includes("bp.json")) {
                        bpJsonValue = statusValue;
                    }
                }
            });

            return { chainApiValue, historyV1Value, hyperionValue, aaApiValue, ipfsValue, lightApiValue, githubValue, seedValue, bpJsonValue };
        });
    };

    // Function to determine if a status is considered successful
    const getStatusValue = (status) => {
        if (status && status.includes('%')) {
            return status === '100.00% OK' ? 1 : 0;
        }
        return status ? 1 : 0;
    };

    // Function to scan a single website and update metrics
    const scanWebsite = async (url, siteLabel) => {
        const page = await browser.newPage();

        // Adding timeout to page navigation
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

        // Adding timeout to the selector wait with corrected selector
        await page.waitForSelector('.flex.flex-col.items-center.max-w-\\[128px\\].justify-center.relative', { timeout: 60000 });

        const values = await extractValues(page);

        // Prepare Prometheus metrics
        const metrics = `
wax_node_${siteLabel}_chain_api_status ${getStatusValue(values.chainApiValue)}
wax_node_${siteLabel}_history_v1_status ${getStatusValue(values.historyV1Value)}
wax_node_${siteLabel}_hyperion_status ${getStatusValue(values.hyperionValue)}
wax_node_${siteLabel}_aa_api_status ${getStatusValue(values.aaApiValue)}
wax_node_${siteLabel}_ipfs_status ${getStatusValue(values.ipfsValue)}
wax_node_${siteLabel}_light_api_status ${getStatusValue(values.lightApiValue)}
wax_node_${siteLabel}_github_status ${getStatusValue(values.githubValue)}
wax_node_${siteLabel}_seed_status ${getStatusValue(values.seedValue)}
wax_node_${siteLabel}_bp_json_status ${getStatusValue(values.bpJsonValue)}
        `;

        // Send metrics to Pushgateway
        try {
            await axios.post(PUSHGATEWAY_URL, metrics, {
                headers: { 'Content-Type': 'text/plain' }
            });
            console.log(`Metrics for ${siteLabel} successfully sent to Pushgateway.`);
        } catch (error) {
            console.error(`Failed to send metrics for ${siteLabel}: ${error.message}`);
        }

        await page.close();
    };

    // URLs to scan with labels for Pushgateway
    const urls = [
        { url: apiUrl_main, label: 'main' },
        { url: apiUrl_test, label: 'test' }
    ];

    // Scan each website and push metrics to the Pushgateway
    for (const site of urls) {
        await scanWebsite(site.url, site.label);
    }

    // Close the browser
    await browser.close();
})();
