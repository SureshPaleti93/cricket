const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const startDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log("DB Error");
    process.exit(1);
  }
};

startDBAndServer();

// API-1  GET PLAYERS DATA

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
        player_id as playerId,
        player_name as playerName
    FROM
        player_details
    ORDER BY
        player_id;`;
  const players = await db.all(getPlayersQuery);
  response.send(players);
});
module.exports = app;

//API-2 GET PLAYER BASED ON PLAYER ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
        player_id as playerId,
        player_name as playerName
    FROM 
        player_details
    WHERE
        player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});
module.exports = app;

// API-3 UPDATE PLAYER DETAILS BASED ON PLAYER ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("player Details Updated");
});
module.exports = app;

// API-4 GET MATCH DETAILS

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
        match_id as matchId,
        match,
        year
    FROM
        match_details
    WHERE
        match_id = ${matchId};
        `;
  const match = await db.get(getMatchQuery);
  response.send(match);
});
module.exports = app;

//API-5  MATCHES PLAYED BY PLAYER

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
  SELECT
    match_id as matchId,
    match,
    year
  FROM 
    player_match_score NATURAL JOIN match_details
  WHERE
    player_match_score.player_id = ${playerId};`;
  const matchIds = await db.all(getMatchQuery);
  response.send(matchIds);
});
module.exports = app;

//API-6 GET LIST OF PLAYERS BY MATCH

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersListQuery = `
    SELECT
        player_details.player_id as playerId,
        player_details.player_name as playerName
    FROM 
        player_match_score NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const matchPlayers = await db.all(getPlayersListQuery);
  response.send(matchPlayers);
});
module.exports = app;

//API-7 GET PLAYER SCORES

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
  SELECT 
        player_details.player_id as playerId,
        player_details.player_name as playerName,
        SUM(player_match_score.score) as totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) as totalSixes,
  FROM 
        player_details INNER JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
  WHERE
        player_details.player_id = ${playerId};`;

  const playerScores = await db.all(getPlayerScoresQuery);
  response.send(playerScores);
});
module.exports = app;
