const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const apiUrl = process.env.GUILD_SITE_SENTNL;
const pushgateway = process.env.SENTNL_PUSHGATEWAY;
const screenshot = process.env.SENTNL_ENABLE_SCREENSHOT === 'true';
const screenshotDir = process.env.SCREENSHOT_PATH || '/tmp';  // Fallback if env var is not set

console.log("API URL:", apiUrl);  // Check if API_URL is correctly passed

if (!apiUrl) {
  throw new Error("API_URL environment variable is missing");
}

if (!pushgateway) {
    throw new Error("API_URL environment variable is missing");
}

(async () => {
    const PUSHGATEWAY_URL = pushgateway;

    // Launch a headless browser with the necessary flags
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Function to extract the status of the first instance of the specified element
    const getStatus = async (page, label) => {
        return await page.evaluate((label) => {
            const elements = document.querySelectorAll('div.flex.h-12.flex-col.items-center.undefined');
            for (let element of elements) {
                const textElement = element.querySelector('div.text-center.text-xs.text-gray');
                if (textElement && textElement.textContent.trim() === label) {
                    const statusIcon = element.querySelector('span.absolute.right-0.top-0.block.h-2.w-2.rounded-full');
                    if (statusIcon) {
                        if (statusIcon.classList.contains('bg-error')) {
                            return 'Error';
                        } else if (statusIcon.classList.contains('bg-success')) {
                            return 'Success';
                        } else {
                            return 'Unknown';
                        }
                    }
                }
            }
            return 'Status not found';
        }, label);
    };

    // Function to scan the website and update metrics
    const scanWebsite = async (url, siteLabel) => {
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector('div.flex.h-12.flex-col.items-center.undefined', { timeout: 60000 }); // Increased timeout to 60 seconds

        const historyV1Status = await getStatus(page, 'History V1');
        const hyperionV2Status = await getStatus(page, 'Hyperion V2');
        const hyperionV2FullStatus = await getStatus(page, 'Hyperion V2 full');
        const hyperionTestnetStatus = await getStatus(page, 'hyperion_testnet');
        const hyperionTestnetFullStatus = await getStatus(page, 'hyperion_testnet_full');
        const atomicApiStatus = await getStatus(page, 'Atomic API');
        const corsCheckStatus = await getStatus(page, 'cors_check');
        const oracleFeedStatus = await getStatus(page, 'oracle_feed');
        const wwwjsonStatus = await getStatus(page, 'wwwjson');

        // Prepare Prometheus metrics
        const getStatusValue = (status) => status === 'Success' ? 1 : 0;
        const metrics = `
wax_sengine_${siteLabel}_history_v1_status ${getStatusValue(historyV1Status)}
wax_sengine_${siteLabel}_hyperion_v2_status ${getStatusValue(hyperionV2Status)}
wax_sengine_${siteLabel}_hyperion_v2_full_status ${getStatusValue(hyperionV2FullStatus)}
wax_sengine_${siteLabel}_hyperion_testnet_status ${getStatusValue(hyperionTestnetStatus)}
wax_sengine_${siteLabel}_hyperion_testnet_full_status ${getStatusValue(hyperionTestnetFullStatus)}
wax_sengine_${siteLabel}_atomic_api_status ${getStatusValue(atomicApiStatus)}
wax_sengine_${siteLabel}_cors_check_status ${getStatusValue(corsCheckStatus)}
wax_sengine_${siteLabel}_oracle_feed_status ${getStatusValue(oracleFeedStatus)}
wax_sengine_${siteLabel}_wwwjson_status ${getStatusValue(wwwjsonStatus)}
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

        if (screenshot) {

            // Take a screenshot and save it with a timestamp in /var/log/validator
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format the timestamp
            // // const screenshotPath = `/var/log/validator/${siteLabel}-${timestamp}.png`;
            const screenshotPath = `${screenshotDir}/${siteLabel}-sentnl-${timestamp}.png`;

            try {
                await page.screenshot({ path: screenshotPath, fullPage: true });  // Capture the entire page
                console.log(`Screenshot for ${siteLabel} saved at ${screenshotPath}`);
            } catch (error) {
                console.error(`Failed to take full-page screenshot for ${siteLabel}: ${error.message}`);
            }
        }              

        await page.close();
    };

    // URL to scan with label for Pushgateway
    const url = apiUrl;
    const label = 'sengine'; // Keeping the original label

    // Scan the website and push metrics to the Pushgateway
    await scanWebsite(url, label);

    // Close the browser
    await browser.close();
})();
