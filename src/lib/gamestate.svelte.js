import { goto } from '$app/navigation'
import { FollowerConnection, LeaderConnection } from './connections'

/**
 * @type {{
*  mode: 'join' | 'play' | 'spy-guess-location' | 'vote-result' | undefined, 
*  role: 'leader' | 'follower' | undefined, 
*  gameId: string | undefined, 
*  playerCount: number,
*  connectionIds: Set<string>,
*  myConnectionId: string | undefined,
*  spyConnectionId: string | undefined,
*  roundMinutes: number,
*  roundWinners: (string | null)[][]
*  roundStartEpoch: number | undefined
*  locations: string[] | undefined
*  location: string | null | undefined
*  voteInitiators: Set<string>
*  currentVoteBy: string | undefined
*  currentVoteResults: Map<string, boolean> | undefined
*  currentVoteAccepted: boolean | null
* }}
*/
export let gameState = $state(initGame())

function initGame() {
    return {
        mode: undefined,
        role: undefined,
        gameId: undefined,
        playerCount: 1,
        connectionIds: new Set(), // only follower connections
        myConnectionId: undefined,  // gameId = leader
        spyConnectionId: undefined, // gameId = leader is the spy
        roundMinutes: 0,
        roundWinners: [],
        roundStartEpoch: undefined,
        locations: undefined,
        location: undefined,
        voteInitiators: new Set(),  // for a follower this will only contain their own connectionId 
        currentVoteBy: undefined,
        currentVoteResults: undefined, // leader only
        currentVoteAccepted: null,
    }
}


/**@type {import('./connections').Connection} */
export let connection

class GameLeaderConnection extends LeaderConnection {
    onPeering(myConnectionId) {
        gameState.myConnectionId = myConnectionId
    }

    onFollowerConnecting(followerConnectionId) {
        if (gameState.mode === 'join' && followerConnectionId !== gameState.gameId && followerConnectionId.length > 0) {
            gameState.connectionIds.add(followerConnectionId)
            return true
        }
        return false
    }

    async onFollowerConnected(followerConnectionId) {
        await this.respond(followerConnectionId, 'init-game', { roundMinutes: gameState.roundMinutes, locations: gameState.locations })
        await this.broadcast('player-count', gameState.connectionIds.size + 1)
    }

    async onMessage(connectionId, type, payload) {
        onMessage(connectionId, type, payload, true, connectionId === gameState.gameId)
    }
}

class GameFollowerConnection extends FollowerConnection {
    onPeering(myConnectionId) {
        gameState.myConnectionId = myConnectionId
    }

    async onMessage(connectionId, type, payload) {
        onMessage(connectionId, type, payload, false, connectionId === gameState.gameId)
    }
}

/** called by leader */
export async function createGame(roundMinutes, locations) {
    gameState.mode = 'join'
    gameState.role = 'leader'
    gameState.gameId = window.crypto.randomUUID().replaceAll('-', '')
    gameState.roundMinutes = roundMinutes
    gameState.locations = locations

    connection = new GameLeaderConnection(gameState.gameId)
    await connection.connect()
}

/** called by leader */
export async function startRound() {
    //cleanup
    gameState.voteInitiators = new Set()
    gameState.currentVoteBy = undefined
    gameState.currentVoteResults = undefined
    gameState.currentVoteAccepted = null

    const location = gameState.locations[Math.floor(gameState.locations.length * Math.random())]
    /** @type {Map<string, import('peerjs').DataConnection>} */
    const spyIdx = Math.floor(gameState.playerCount * Math.random())
    gameState.spyConnectionId = [...gameState.connectionIds, gameState.myConnectionId][spyIdx]

    await Promise.all([...gameState.connectionIds, gameState.myConnectionId].map(async connId => {
        return await connection.respond(connId, 'start-round', {
            location: connId === gameState.spyConnectionId ? null : location,
            roundStartEpoch: new Date().getTime()
        })
    }))
}

/** called by followers */
export async function joinGame(gameId) {
    gameState.mode = 'join'
    gameState.role = 'follower'
    gameState.gameId = gameId

    connection = new GameFollowerConnection(gameState.gameId)
    await connection.connect()
}

export async function respondVote(accept) {
    gameState.currentVoteAccepted = accept
    await connection.respondVote(accept)
}

/** called by leader */
export async function submitRoundResult(spyHasWon) {
    const roundWinners = spyHasWon ? [gameState.spyConnectionId] :
        [...gameState.connectionIds, gameState.myConnectionId].filter(connId => connId !== gameState.spyConnectionId)
    await connection.broadcast('announce-round-winners', roundWinners)
}

export async function timeIsUpReveal() {
    await connection.broadcast('time-is-up-reveal')
}

/**
    message flow:

    leader: connect to signaling server (connection id == game id)
    follower: connect to signaling server
    leader: accept connection
    leader: broadcast 'init-game'
    leader: broadcast 'player-count'
    leader: broadcast 'start-round'
    
    any: send 'request-vote'
    leader: broadcast 'start-vote'
    all: send 'respond-vote'
    leader: broadcast 'stop-vote'
    leader: broadcast 'announce-round-winners'

    spy: send 'reveal-spy'
    leader: broadcast 'spy-guess-location'
    leader: broadcast 'announce-round-winners'

    leader: broadcast 'time-is-up-reveal'
*/
async function onMessage(connectionId, type, payload, iAmLeader, isFromLeader) {
    switch (type) {
        case 'init-game':
            if (!iAmLeader) {
                gameState.roundMinutes = payload.roundMinutes
                gameState.locations = payload.locations
            } break

        case 'player-count':
            if (isFromLeader) {
                gameState.playerCount = payload
            } break

        case 'start-round':
            if (isFromLeader) {
                gameState.roundStartEpoch = payload.roundStartEpoch
                gameState.location = payload.location
                gameState.mode = 'play'
                if (gameState.roundWinners.length === 0) // first round
                    goto('/play')
            } break

        case 'request-vote':
            if (iAmLeader) {
                if (gameState.mode === 'play' && !gameState.voteInitiators.has(connectionId) && !gameState.currentVoteBy) {
                    gameState.currentVoteBy = connectionId
                    gameState.currentVoteResults = new Map()
                    await connection.broadcast('start-vote', connectionId)
                } else {
                    connection.respond(connectionId, 'reject-vote', 'already voted or another vote is already active')
                }
            } break

        case 'start-vote':
            if (isFromLeader) {
                gameState.currentVoteAccepted = null
                gameState.currentVoteBy = payload
                gameState.voteInitiators.add(gameState.currentVoteBy)
                if (gameState.currentVoteBy === gameState.myConnectionId)
                    await respondVote(true)
            } break

        case 'respond-vote':
            if (iAmLeader) {
                if (gameState.mode === 'play' && !!gameState.currentVoteBy && !gameState.currentVoteResults.has(connectionId)) {
                    gameState.currentVoteResults.set(connectionId, payload)
                    if (gameState.currentVoteResults.size === gameState.playerCount) {
                        /* one player is allowed to not accept the vote as one person is always the accused one */
                        const isResolution = [...gameState.currentVoteResults.values()].filter(v => !!v).length >= gameState.playerCount - 1
                        await connection.broadcast('stop-vote', isResolution)
                    }
                } else {
                    await connection.respond(connectionId, 'reject-vote', 'no active vote')
                }
            } break

        case 'stop-vote':
            if (isFromLeader && gameState.mode === 'play' && !!gameState.currentVoteBy) {
                gameState.currentVoteBy = undefined
                gameState.currentVoteResults = undefined
                gameState.currentVoteAccepted = null
                if (payload)
                    gameState.mode = 'vote-result'
            } break

        case 'reveal-spy':
            if (iAmLeader) {
                if (gameState.mode === 'play' && !gameState.currentVoteBy && connectionId === gameState.spyConnectionId) {
                    await connection.broadcast('spy-guess-location')
                } else {
                    await connection.respond(connectionId, 'reject-reveal-spy', 'wrong conditions')
                }
            } break

        case 'spy-guess-location':
            if (isFromLeader && gameState.mode === 'play' && !gameState.currentVoteBy) {
                gameState.mode = 'spy-guess-location'
            } break

        case 'announce-round-winners':
            if (isFromLeader) {
                gameState.roundWinners.push(payload)
                if (iAmLeader)
                    startRound()
            } break

        case 'time-is-up-reveal':
            if (isFromLeader) {
                gameState.mode = 'vote-result'
            } break


        default:
            console.error('unknown message type received:', connectionId, type, payload)
            break
    }
}
