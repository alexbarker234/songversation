# Songversation - A NextJS port of our Flask CITS3403 Project

A lyric guessing game - powered by NextJS

## Setting up locally

### Getting the local refresh token
- The refresh token will be used for features of the app that don't require a user login

1. Log in with Spotify
    - `https://accounts.spotify.com/en/authorize?client_id=[INSERT CLIENT ID HERE]&response_type=code&redirect_uri=http%3A%2F%2Flocalhost:3000&scope=user-read-currently-playing%20user-top-read`
2. Grab the `code=[code]` part of the URL
    - Will look like: `http://localhost:3000/?code=[code]`
3. Base64 encode your client id & secret. Can use [base64encode.org](https://www.base64encode.org/)
    - Format: `[clientidhere]:[clientsecrethere]`
4. Make this curl request
    - `curl -H "Authorization: Basic [base64here]"
-d grant_type=authorization_code -d code=[code here] -d redirect_uri=http%3A%2F%2Flocalhost:3000 https://accounts.spotify.com/api/token`
5. Grab the `refresh_token` from the response