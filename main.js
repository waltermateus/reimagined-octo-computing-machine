document.getElementById('fetchForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const domain = document.getElementById('domainInput').value;
    fetchUrls(domain);
});

async function fetchUrls(domain) {
    const outputElement = document.getElementById('output');
    outputElement.textContent = 'Buscando URLs...';

    try {
        const urls = await Promise.all([
            getWaybackURLs(domain),
            getCommonCrawlURLs(domain),
            getVirusTotalURLs(domain)
        ]);

        const allUrls = [].concat(...urls);
        const uniqueUrls = [...new Set(allUrls.map(url => url.url))];

        outputElement.textContent = uniqueUrls.join('\n');
    } catch (error) {
        outputElement.textContent = `Erro ao buscar URLs: ${error.message}`;
    }
}

async function getWaybackURLs(domain) {
    const response = await fetch(`http://web.archive.org/cdx/search/cdx?url=${domain}/*&output=json&collapse=urlkey`);
    const data = await response.json();
    return data.slice(1).map(item => ({ date: item[1], url: item[2] }));
}

async function getCommonCrawlURLs(domain) {
    const response = await fetch(`http://index.commoncrawl.org/CC-MAIN-2018-22-index?url=${domain}/*&output=json`);
    const data = await response.json();
    return data.map(item => ({ date: item.timestamp, url: item.url }));
}

async function getVirusTotalURLs(domain) {
    const apiKey = 'YOUR_VIRUSTOTAL_API_KEY';
    if (!apiKey) return [];

    const response = await fetch(`https://www.virustotal.com/vtapi/v2/domain/report?apikey=${apiKey}&domain=${domain}`);
    const data = await response.json();
    return data.detected_urls.map(item => ({ date: null, url: item.url }));
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
