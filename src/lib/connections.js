import Peer from 'peerjs'

export class Connection { // abstract base class
    async request(type, payload = undefined) {
    }

    onPeering(myConnectionId) {
    }

    async connect() { }

    async onMessage(connectionId, type, payload) {

    }

    async requestVote() {
        await this.request('request-vote')
    }

    async respondVote(accept) {
        await this.request('respond-vote', accept)
    }

    async revealSpy() {
        await this.request('reveal-spy')
    }
}

export class LeaderConnection extends Connection {
    /** @type {Map<string, import('peerjs').DataConnection>} */
    #connections = new Map()
    #gameId

    constructor(gameId) {
        super()
        this.#gameId = gameId
    }

    /** @returns {boolean} */
    onFollowerConnecting(followerConnectionId) {
    }

    onFollowerConnected(followerConnectionId) {

    }

    connect() {
        return new Promise((resolve) => {
            const peer = new Peer(this.#gameId)
            peer.on('open', (id) => {
                this.onPeering(id)

                peer.on('connection', (conn) => {
                    if (this.onFollowerConnecting(conn.peer)) {
                        this.#connections.set(conn.peer, conn)
                        conn.on('data', async ({ type, payload }) => {
                            this.onMessage(conn.peer, type, payload)
                        })

                        conn.on('close', (e) => {
                            console.log('conn to follower closed:', e)
                            this.#connections.delete(conn.peer)
                            // this.updatePlayerCount() // todo
                        })
                        conn.on('error', (e) => console.log('leader conn error:', e)) // todo

                        conn.on('open', async () => {
                            this.onFollowerConnected(conn.peer)
                        })
                    }
                })

                resolve()
            })
            peer.on('close', () => console.log('leader close')) // todo
            peer.on('disconnected', () => console.log('leader disconnected')) // todo
            peer.on('error', (e) => console.log('leader error', e)) // todo
        })
    }

    async request(type, payload = undefined) {
        this.onMessage(this.#gameId, type, payload)
    }

    async respond(connectionId, type, payload = undefined) {
        console.log('send to', connectionId, type, payload)
        if (connectionId === this.#gameId)
            await this.onMessage(this.#gameId, type, payload)
        else
            await this.#connections.get(connectionId)?.send({ type, payload })
    }

    async broadcast(type, payload = undefined) {
        console.log('broadcast', type, payload)
        await Promise.all([...this.#connections.keys(), this.#gameId].map(async connId => {
            return await this.respond(connId, type, payload)
        }))
    }
}

export class FollowerConnection extends Connection {
    #connection
    #gameId

    constructor(gameId) {
        super()
        this.#gameId = gameId
    }

    connect() {
        return new Promise((resolve) => {
            const peer = new Peer()
            peer.on('close', () => console.log('follower close')) // todo
            peer.on('disconnected', () => console.log('follower disconnected')) // todo
            peer.on('error', (e) => console.log('follower error', e)) // todo

            peer.on('open', (id) => {
                this.onPeering(id)

                const conn = peer.connect(this.#gameId)

                conn.on('open', () => {
                    this.#connection = conn

                    conn.on('data', async ({ type, payload }) => {
                        this.onMessage(conn.peer, type, payload)
                    })

                    resolve()
                })

                conn.on('close', () => console.log('follower conn close')) // todo
                conn.on('error', (e) => console.log('follower conn error:', e)) // todo
            })
        })
    }

    async request(type, payload = undefined) {
        this.#connection.send({ type, payload })
    }
}
