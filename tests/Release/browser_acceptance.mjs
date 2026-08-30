import { writeFile } from 'node:fs/promises';

const applicationUrl = process.argv[2] ?? 'http://127.0.0.1:8000';
const devtoolsUrl = process.argv[3] ?? 'http://127.0.0.1:9222';
const browserPages = await fetch(`${devtoolsUrl}/json/list`).then((response) => response.json());
const browserPage = browserPages.find((page) => page.type === 'page');

if (!browserPage) {
    throw new Error(`No browser page is available at ${devtoolsUrl}.`);
}

const socket = new WebSocket(browserPage.webSocketDebuggerUrl);
const pendingCommands = new Map();
const browserErrors = [];
let commandId = 0;

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.id && pendingCommands.has(message.id)) {
        pendingCommands.get(message.id)(message);
        pendingCommands.delete(message.id);
        return;
    }

    if (message.method === 'Runtime.exceptionThrown') {
        browserErrors.push(message.params.exceptionDetails.text);
    }

    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        browserErrors.push(message.params.entry.text);
    }
});

await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
});

function send(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = ++commandId;
        pendingCommands.set(id, (message) => {
            if (message.error) {
                reject(new Error(`${method}: ${message.error.message}`));
                return;
            }

            resolve(message.result);
        });
        socket.send(JSON.stringify({ id, method, params }));
    });
}

async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
    });

    if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text);
    }

    return result.result.value;
}

async function waitFor(expression, description, timeout = 12_000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
        if (await evaluate(expression)) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Timed out waiting for ${description}.`);
}

async function navigate(path) {
    await send('Page.navigate', { url: `${applicationUrl}${path}` });
    await waitFor("document.readyState === 'complete'", `${path} to load`);
    await waitFor("document.querySelector('main, form, section') !== null", `${path} content`);
}

async function clickButton(text) {
    const clicked = await evaluate(`(() => {
        const expected = ${JSON.stringify(text)};
        const element = [...document.querySelectorAll('button, a')]
            .find((candidate) => candidate.textContent.replace(/\\s+/g, ' ').trim().includes(expected));
        if (!element) return false;
        element.click();
        return true;
    })()`);

    if (!clicked) {
        throw new Error(`Could not find an interactive element containing “${text}”.`);
    }
}

async function fillInput(name, value) {
    const filled = await evaluate(`(() => {
        const input = document.querySelector('[name=${JSON.stringify(name)}]');
        if (!(input instanceof HTMLInputElement)) return false;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, ${JSON.stringify(value)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    })()`);

    if (!filled) {
        throw new Error(`Could not fill input “${name}”.`);
    }
}

async function auditPage(label) {
    const audit = await evaluate(`(() => {
        const visible = (element) => {
            const style = getComputedStyle(element);
            const bounds = element.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && bounds.width > 0 && bounds.height > 0;
        };
        const labelText = (element) => {
            const explicit = element.id ? document.querySelector('label[for="' + CSS.escape(element.id) + '"]')?.textContent : '';
            return element.getAttribute('aria-label')
                || (element.getAttribute('aria-labelledby') || '').split(/\\s+/).map((id) => document.getElementById(id)?.textContent).join(' ')
                || explicit
                || element.closest('label')?.textContent
                || element.getAttribute('title')
                || element.getAttribute('alt')
                || element.textContent;
        };
        const controls = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea')]
            .filter((element) => visible(element) && !element.disabled);
        const unnamedControls = controls
            .filter((element) => !labelText(element)?.replace(/\\s+/g, ' ').trim())
            .map((element) => element.outerHTML.slice(0, 180));
        const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
        const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        const imagesWithoutAlt = [...document.querySelectorAll('img')]
            .filter((image) => !image.hasAttribute('alt'))
            .map((image) => image.outerHTML.slice(0, 180));
        return {
            title: document.title,
            path: location.pathname,
            heading: document.querySelector('h1')?.textContent?.trim() ?? null,
            unnamedControls,
            duplicateIds,
            imagesWithoutAlt,
            horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
    })()`);

    const failures = [
        audit.unnamedControls.length && `unnamed controls: ${audit.unnamedControls.join(', ')}`,
        audit.duplicateIds.length && `duplicate IDs: ${audit.duplicateIds.join(', ')}`,
        audit.imagesWithoutAlt.length && `images without alt text: ${audit.imagesWithoutAlt.join(', ')}`,
        audit.horizontalOverflow && 'horizontal overflow',
    ].filter(Boolean);

    if (failures.length) {
        throw new Error(`${label} (${audit.path}) failed: ${failures.join('; ')}`);
    }

    console.log(`PASS ${label}: ${audit.path} — ${audit.heading ?? audit.title}`);
}

async function setViewport(width, height, mobile) {
    await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
    });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await setViewport(1440, 900, false);

await navigate('/');
await waitFor("location.pathname === '/setup'", 'the single-user setup redirect');
await auditPage('desktop single-user setup');
await fillInput('name', 'Phase 17 Acceptance');
await clickButton('Continue');
await waitFor("document.querySelector('h1')?.textContent.includes('How should we begin?')", 'onboarding path');
await auditPage('desktop onboarding path');
await clickButton('Start fresh');
await waitFor("document.querySelector('h1')?.textContent.includes('30-day rhythm')", 'onboarding profile');
await auditPage('desktop onboarding profile');
await clickButton('Confirm and create Season 1');
await waitFor("document.querySelector('h1')?.textContent.includes('Objectives')", 'onboarding objectives');
await auditPage('desktop onboarding objectives');
await clickButton('Skip');
await waitFor("document.querySelector('h1')?.textContent.includes('Habit')", 'onboarding habit');
await auditPage('desktop onboarding habit');
await clickButton('Skip');
await waitFor("document.querySelector('h1')?.textContent.includes('Task')", 'onboarding task');
await auditPage('desktop onboarding task');
await clickButton('Skip');
await waitFor("document.querySelector('h1')?.textContent.includes('Money useful')", 'onboarding money');
await auditPage('desktop onboarding money');
await clickButton('Finish setup');
await waitFor("location.pathname === '/season-introduction'", 'Season introduction');
await auditPage('desktop Season introduction');
await clickButton('Enter Season');
await waitFor("location.pathname === '/seasons'", 'Seasons after onboarding');

const workflowPaths = ['/home', '/seasons', '/money', '/money/subscriptions', '/settings/general'];

for (const path of workflowPaths) {
    await navigate(path);
    await auditPage(`desktop workflow ${path}`);
}

await setViewport(390, 844, true);

for (const path of workflowPaths) {
    await navigate(path);
    await auditPage(`mobile workflow ${path}`);
}

await clickButton('More');
await waitFor("document.querySelector('[role=dialog]') !== null", 'mobile navigation drawer');
await auditPage('mobile navigation drawer');

const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await writeFile('/tmp/achelife-phase17-mobile.png', Buffer.from(screenshot.data, 'base64'));

if (browserErrors.length) {
    throw new Error(`Browser errors: ${browserErrors.join(' | ')}`);
}

console.log('Browser acceptance passed without runtime errors.');
socket.close();
