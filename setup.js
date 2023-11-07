const http = require("http");
const { exec } = require("child_process");

const fs = require("fs");
const https = require("https");
const url = require("url");
const querystring = require("querystring");

// Load the client ID and secret from the .env.local file
const envLocal = fs.readFileSync(".env.local", "utf-8");
const envVariables = envLocal.split("\n").reduce((acc, line) => {
    const [key, value] = line.split("=");
    if (key && value) {
        acc[key] = value;
    }
    return acc;
}, {});
const clientId = envVariables.SPOTIFY_CLIENT_ID;
const clientSecret = envVariables.SPOTIFY_CLIENT_SECRET;
const localHostUrl = "http://localhost:3000";

// Open a server to manage user login and code retrieval
const server = http.createServer( async (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });

    const parsedUrl = url.parse(`${localHostUrl}${req.url}`, true);
    if (!parsedUrl.query.code) {
        res.end(`No code supplied`);
        return;
    }

    const token = await getRefreshToken(parsedUrl.query.code);
    res.end(`${token}`);
    process.exit()
});

const getRefreshToken = (code) => {
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenUrl = "https://accounts.spotify.com/api/token";
    const formData = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: localHostUrl,
    };

    const requestOptions = {
        method: "POST",
        headers: {
            Authorization: `Basic ${base64Credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };
    return new Promise((resolve, reject) => {
        const req = https.request(tokenUrl, requestOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                if (res.statusCode === 200) {
                    const tokenResponse = JSON.parse(data);
                    const refreshToken = tokenResponse.refresh_token;
                    resolve(refreshToken);
                    console.log();
                } else {
                    resolve(`Error obtaining the refresh token: ${data}`);
                }
            });
        });

        console.log(querystring.stringify(formData));
        req.write(querystring.stringify(formData));
        req.end();
    });
};

server.listen(3000, () => {
    console.log(`Server is running on port 3000`);
    var start = process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open";
    const encodedRedirect = encodeURIComponent(localHostUrl);
    const loginUrl =
        `https://accounts.spotify.com/en/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodedRedirect}&scope=user-read-currently-playing%20user-top-read`.replaceAll(
            "&",
            '"&"'
        );
    //exec(`${start} http://localhost:3000`);
    exec(`${start} ${loginUrl}`);
});