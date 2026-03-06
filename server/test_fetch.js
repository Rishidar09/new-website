const fetch = require('node-fetch');
const url = `https://date.nager.at/api/v3/AvailableCountries`;

console.log('Fetching:', url);

fetch(url)
    .then(async res => {
        console.log('Status:', res.status);
        const data = await res.json();
        const india = data.find(c => c.countryCode === 'IN');
        console.log('India in list:', india ? 'Yes' : 'No');
        console.log('Total countries:', data.length);
    })
    .catch(err => {
        console.error('Fetch failed:', err.message);
    });
