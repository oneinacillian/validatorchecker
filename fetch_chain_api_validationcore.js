const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const apiUrl_test = process.env.GUILD_SITE_VALIDATIONCORE_TESTNET;
const apiUrl_main = process.env.GUILD_SITE_VALIDATIONCORE_MAINNET;
const pushgateway = process.env.VALIDATIONCORE_PUSHGATEWAY;
const screenshot = process.env.VALIDATIONCORE_ENABLE_SCREENSHOT === 'true';

console.log("API URL:", apiUrl_test);  // Check if API_URL is correctly passed
console.log("API URL:", apiUrl_main);  // Check if API_URL is correctly passed

if (!apiUrl_test) {
  throw new Error("API_URL environment variable is missing");
}

if (!apiUrl_main) {
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

    // Function to extract status based on the element text
    const getStatus = async (page, label) => {
        return await page.evaluate((label) => {
            const elements = document.querySelectorAll('p.m-0.text-white');
            let statusText = 'Status not found';

            elements.forEach(element => {
                if (element.textContent.includes(label)) {
                    const statusIcon = element.previousElementSibling.querySelector('.status .svg-icon');
                    if (statusIcon) {
                        if (statusIcon.classList.contains('svg-icon-danger')) {
                            statusText = 'Error';
                        } else if (statusIcon.classList.contains('svg-icon-success')) {
                            statusText = 'Success';
                        } else {
                            statusText = 'Unknown';
                        }
                    }
                }
            });

            return statusText;
        }, label);
    };

    // Function to scan a single website and update metrics
    const scanWebsite = async (url, siteLabel) => {
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector('p.m-0.text-white', { timeout: 60000 }); // Increased timeout to 60 seconds

        const historyStatus = await getStatus(page, 'History');
        const hyperionStatus = await getStatus(page, 'Hyperion');
        const atomicStatus = await getStatus(page, 'Atomic');
        const seedStatus = await getStatus(page, 'Seed');
        const apiStatus = await getStatus(page, 'Api');

        // Prepare Prometheus metrics
        const getStatusValue = (status) => status === 'Success' ? 1 : 0;
        const metrics = `
wax_validation_${siteLabel}_history_status ${getStatusValue(historyStatus)}
wax_validation_${siteLabel}_hyperion_status ${getStatusValue(hyperionStatus)}
wax_validation_${siteLabel}_atomic_status ${getStatusValue(atomicStatus)}
wax_validation_${siteLabel}_seed_status ${getStatusValue(seedStatus)}
wax_validation_${siteLabel}_api_status ${getStatusValue(apiStatus)}
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
            const screenshotPath = `/root/githubtest/websiteinterrogate/composedeploy/validatorchecker/screenshots/${siteLabel}-validationcore-${timestamp}.png`;

            try {
                await page.screenshot({ path: screenshotPath, fullPage: true });  // Capture the entire page
                console.log(`Screenshot for ${siteLabel} saved at ${screenshotPath}`);
            } catch (error) {
                console.error(`Failed to take full-page screenshot for ${siteLabel}: ${error.message}`);
            }
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
