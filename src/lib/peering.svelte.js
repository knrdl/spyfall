
import Peer from 'peerjs'
import { goto } from '$app/navigation'

/**
 * @type {import('svelte').Component<{
 *  mode: 'join' | 'play' | null, 
 *  role: 'leader' | 'follower' | null, 
 *  gameId: string | null, 
 *  playerCount: number | null,
 *  roundMinutes: number | null,
 *  locations: string[] | null
 *  location: string | null
 *  voteInitiators: string[] | null
 *  currentVoteBy: string | null
 *  connection: GameLeaderConnection|GameFollowerConnection
 * }>}
 */
export let gameState = $state({
    mode: null,
    role: null,
    gameId: null,
    playerCount: null,
    roundMinutes: null,
    startEpoch: null,
    locations: null,
    location: null,
    voteInitiators: null,
    currentVoteBy: null,
    currentVoteResults: null, // leader only
    currentVoteAccepted: null,  // follower only
    connection: null
})

export async function createGame(roundMinutes, locations) {
    gameState.mode = 'join'
    gameState.role = 'leader'
    gameState.gameId = window.crypto.randomUUID().replaceAll('-', '')
    gameState.roundMinutes = roundMinutes
    gameState.locations = locations
    gameState.voteInitiators = []
    gameState.currentVoteBy = null
    gameState.currentVoteResults = null
    gameState.playerCount = 1
    gameState.connection = new GameLeaderConnection()
    await gameState.connection.connect()
}

export async function startGame() {
    const location = gameState.locations[Math.floor(gameState.locations.length * Math.random())]
    /** @type {Map<string, import('peerjs').DataConnection>} */
    const connIds = [...gameState.connection.connections.keys()]
    const spyIdx = Math.floor(gameState.playerCount * Math.random())
    const iAmSpy = spyIdx === gameState.playerCount - 1
    const spyConnId = iAmSpy ? null : connIds[spyIdx]
    gameState.location = iAmSpy ? null : location
    gameState.startEpoch = new Date().getTime()

    await Promise.all(connIds.map(async connId => {
        await gameState.connection.send(connId, 'start-game', {
            location: connId === spyConnId ? null : location,
            startEpoch: gameState.startEpoch
        })
        // /** @type {import('peerjs').DataConnection} */
        // const conn = gameState.connection.connections.get(connId)
        // if (connId === spyConnId)
        //     await conn.send('start-game', { location: null })
        // else
        //     await conn.send('start-game', { location })
    }))
    // await gameState.connection.broadcast('start-game')
}

export async function joinGame(gameId) {
    gameState.mode = 'join'
    gameState.role = 'follower'
    gameState.gameId = gameId
    gameState.voteInitiators = []
    gameState.currentVoteBy = null
    gameState.connection = new GameFollowerConnection()

    await gameState.connection.connect()
}

class GameLeaderConnection {
    /** @type {Map<string, import('peerjs').DataConnection>} */
    connections

    constructor() {
        this.connections = new Map()
    }

    connect() {
        return new Promise((resolve, reject) => {
            const peer = new Peer(gameState.gameId)
            peer.on('open', (id) => {
                console.log('Leader ID is: ' + id)

                peer.on('close', () => console.log('leader close'))
                peer.on('disconnected', () => console.log('leader disconnected'))
                peer.on('error', (e) => console.log('leader error', e))

                peer.on('connection', (conn) => {
                    console.log('new connection')
                    if (gameState.mode === 'join' && conn.peer !== gameState.gameId) {
                        this.connections.set(conn.peer, conn)
                        conn.on('data', ({ type, payload }) => {
                            console.log('leader received', conn.peer, type, payload)
                            switch (type) {
                                case 'request-vote':
                                    if (!gameState.voteInitiators.includes(conn.peer) && gameState.currentVoteBy === null) {
                                        gameState.voteInitiators.push(conn.peer)
                                        gameState.currentVoteBy = conn.peer
                                        gameState.currentVoteResults = new Map()
                                        gameState.currentVoteAccepted = null
                                        this.broadcast('start-vote', gameState.currentVoteBy)
                                    } else {
                                        this.send(conn.peer, 'reject-vote', 'already voted or another vote is already active')
                                    }
                                    break
                                case 'respond-vote':
                                    if (gameState.currentVoteBy !== null) {
                                        gameState.currentVoteResults.set(conn.peer, payload)
                                        this.handleVoteEnd()
                                    } else {
                                        this.send(conn.peer, 'reject-vote', 'no active vote')
                                    }
                                    break


                                default:
                                    console.error('unknown message type received:', conn.peer, type, payload)
                                    break
                            }
                        })
                        conn.on('close', (e) => {
                            console.log('conn to follower closed:', e)
                            this.connections.delete(conn.peer)
                            this.updatePlayerCount()
                        })
                        conn.on('error', (e) => console.log('leader conn error:', e))
                        conn.on('iceStateChanged', (e) => console.log('leader conn iceStateChanged:', e))

                        conn.on('open', () => {
                            this.broadcast('init-game', { roundMinutes: gameState.roundMinutes, locations: gameState.locations })
                            this.updatePlayerCount()
                        })
                    } else {
                        conn.close()
                    }
                })

                resolve()
            })
        })
    }

    broadcast(type, payload = undefined) {
        console.log('broadcast', type, payload)
        this.connections.forEach(conn => {
            conn.send({ type, payload })
        })
    }

    async send(peerId, type, payload = undefined) {
        console.log('send to', peerId, type, payload)
        await this.connections.get(peerId)?.send({ type, payload })
    }

    updatePlayerCount() {
        gameState.playerCount = this.connections.size + 1
        this.broadcast('player-count', gameState.playerCount)
    }

    requestVote() {
        gameState.voteInitiators.push(gameState.gameId)
        gameState.currentVoteBy = gameState.gameId
        gameState.currentVoteAccepted = null
        gameState.currentVoteResults = new Map()
        gameState.currentVoteAccepted = null
        this.broadcast('start-vote', gameState.currentVoteBy)
        if (gameState.currentVoteBy === gameState.gameId)
            this.respondVote(true)
    }

    respondVote(accept) {
        gameState.currentVoteAccepted = accept
        gameState.currentVoteResults.set(gameState.gameId, accept)
        this.handleVoteEnd()
    }

    handleVoteEnd() {
        if (gameState.currentVoteResults.size === gameState.playerCount) {
            /* one player is allowed to not accept the vote as one person is always the accused one */
            const isResolution = [...gameState.currentVoteResults.values()].filter(v => !!v).length >= gameState.playerCount - 1
            this.broadcast('stop-vote', isResolution)
            gameState.currentVoteBy = null
            gameState.currentVoteResults = null
        }
    }
}

class GameFollowerConnection {

    #connection

    peerId = undefined

    constructor() {
    }

    connect() {
        return new Promise((resolve, reject) => {
            const peer = new Peer()

            peer.on('close', () => console.log('follower close'))
            peer.on('disconnected', () => console.log('follower disconnected'))
            peer.on('error', (e) => console.log('follower error', e))


            peer.on('open', (id) => {
                this.peerId = id
                console.log('Follower ID is: ' + id)

                const conn = peer.connect(gameState.gameId)
                conn.on('open', () => {
                    this.#connection = conn
                    conn.on('data', ({ type, payload }) => {
                        console.log('Follower received: ', type, payload)
                        switch (type) {
                            case 'player-count':
                                gameState.playerCount = payload
                                break

                            case 'init-game':
                                gameState.roundMinutes = payload.roundMinutes
                                gameState.locations = payload.locations
                                break

                            case 'start-game':
                                gameState.mode = 'play'
                                gameState.location = payload.location
                                gameState.startEpoch = payload.startEpoch
                                goto('/play')
                                break

                            case 'start-vote':
                                gameState.currentVoteBy = payload
                                gameState.currentVoteAccepted = null
                                if (gameState.currentVoteBy === this.peerId)
                                    this.respondVote(true)
                                break

                            case 'stop-vote':
                                gameState.currentVoteBy = null
                                gameState.currentVoteResults = null
                                alert('Ergebnis: ' + payload) // todo
                                break

                            default:
                                console.error('unknown message type received:', type, payload)
                                break
                        }
                    })
                    resolve()
                })
                conn.on('close', () => console.log('follower conn close'))
                conn.on('error', (e) => console.log('follower conn error:', e))
                conn.on('iceStateChanged', (e) => console.log('follower conn iceStateChanged:', e))
            })
        })
    }

    send(type, payload = undefined) {
        this.#connection.send({ type, payload })
    }

    requestVote() {
        gameState.voteInitiators.push(this.peerId)
        this.send('request-vote')
    }

    respondVote(accept) {
        gameState.currentVoteAccepted = accept
        this.send('respond-vote', accept)
    }
}
