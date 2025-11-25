const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Proxy endpoint for Meetup GraphQL API
app.post('/api/meetup', async (req, res) => {
    try {
        const { body, cookie } = req.body;

        if (!cookie) {
            return res.status(400).json({
                error: 'Cookie is required. Please set your Meetup.com cookie in the UI.'
            });
        }

        const headers = {
            'accept': '*/*',
            'accept-language': 'en-US',
            'apollographql-client-name': 'nextjs-web',
            'content-type': 'application/json',
            'cookie': cookie,
            'origin': 'https://www.meetup.com',
            'referer': 'https://www.meetup.com/groups/',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
        };

        console.log('Making request to Meetup API:', body.operationName);

        const response = await fetch('https://www.meetup.com/gql2', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('Meetup API error:', response.status, data);
            return res.status(response.status).json(data);
        }

        console.log('Success:', body.operationName);
        res.json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Failed to proxy request to Meetup API',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Meetup Group Manager server running!`);
    console.log(`📱 Open your browser to: http://localhost:${PORT}`);
    console.log(`🔧 Proxy endpoint: http://localhost:${PORT}/api/meetup\n`);
});
