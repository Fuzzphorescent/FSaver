const Discord = require("discord.js");
const Client = new Discord.Client({ 
    intents: [ 
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES
  ]
 });

 const Config = require("../config.js");

let scopes = ['user-read-private', 'playlist-modify-private', 'playlist-read-private', 'playlist-modify-public%20playlist-read-collaborative'],
redirectUri = 'http://localhost/';

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
    clientId: Config.SPOTIFY_CLIENT_ID,
    clientSecret: Config.SPOTIFY_CLIENT_SECRET,
    redirectUri: redirectUri
  });

let authURL = spotifyApi.createAuthorizeURL(scopes);
console.log(authURL);

spotifyApi.setAccessToken(Config.SPOTIFY_ACCESS_TOKEN);
spotifyApi.setRefreshToken(Config.SPOTIFY_REFRESH_TOKEN);

spotifyApi.refreshAccessToken().then(data =>
    {
      console.log('Access token refreshed.');
      spotifyApi.setAccessToken(data.body['access_token']);
    },
    err => console.log('Could not refresh access token', err));

setInterval(() => {
    spotifyApi.refreshAccessToken().then(data =>
        {
          console.log('Access token refreshed');
          spotifyApi.setAccessToken(data.body['access_token']);
        },
        err => console.log('Could not refresh access token', err));
}, 45 * 60 * 1000);

// Connect to discord bot

Client.on('ready', readybot);
Client.on('messageCreate', getMessages);
Client.login(Config.DISCORD_BOT_TOKEN);

function readybot() {
    console.log ('FSaver is online.');
}

// Register a handler for MessageCreated event

function getMessages(message) {
    if (message.content == "run fsaver") {
        let channel = message.channel;
        let manager = message.channel.messages;
        manager.fetch({limit: 100}).then(result => {
            result = result.filter(msg => msg.content.startsWith("fsave"));
            channel.send("**Query results for fsave:**\n");
            result.each(msg => {
                let query = msg.content.slice(6);
                searchSpotifyTracks(query).then(result => {
                    channel.send('• ' + query);
                    channel.send(result);
                });
            });
        });
    }
}

async function searchSpotifyTracks(query) {
    let results = await spotifyApi.searchTracks(query).catch(console.log);
    let topTrack = results.body.tracks.items[0];
    saveToPlaylist(topTrack);
    return printTrack(topTrack);
}

function printTrack(track) {
    let artists = track.artists.map(artist => artist.name).join(', '); //string
    let trackName = track.name;
    let url = track.external_urls.spotify;
    return '• ' + artists + " - " + trackName + " (" + url + ")";
}

function saveToPlaylist(track) {
    spotifyApi.addTracksToPlaylist(Config.SPOTIFY_PLAYLIST_ID, [track.uri]);
}

// get list of tracks from playlistID
// get list of duplicates' uri
// remove duplicates

function removeDuplicateTracks(tracks) {
    let items = tracks.body.items;
    let length = items.length;
    let arrayOfUriObjects = [];
    for (let i = length - 1; i > 0; i--) {
        for (let j = i-1; j >= 0; j--) {
            if (items[i].track.id == items[j].track.id) {
                let count = 0;
                for (let k = 0; k < arrayOfUriObjects.length; k++) {
                    if (arrayOfUriObjects[k] == items[i].track.uri)
                        break;
                    else count++;
                }
                if (count > 0)
                        arrayOfUriObjects.push({
                            uri: items[i].track.uri
                });
            }
        }
    }
    console.log(arrayOfUriObjects)
    spotifyApi.removeTracksFromPlaylist(Config.SPOTIFY_PLAYLIST_ID, arrayOfUriObjects).then(
        () => console.log('Duplicate tracks removed.'),
        err => console.log("Failed to remove duplicate tracks" + err)
    );   
}

spotifyApi.getPlaylistTracks(Config.SPOTIFY_PLAYLIST_ID).then(result => removeDuplicateTracks(result), console.log);
