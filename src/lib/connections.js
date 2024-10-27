import Peer from 'peerjs'

export class Connection { // abstract base class
    async request(type, payload = undefined) { }

    onPeering(myConnectionId) { }

    async connect() { }

    async disconnect() { }

    async onMessage(connectionId, type, payload) { }

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
    /** @type {string} */
    #gameId
    /** @type {Peer} */
    #peer

    constructor(gameId) {
        super()
        this.#gameId = gameId
    }

    /** @returns {boolean} */
    onFollowerConnecting(followerConnectionId) { }

    onFollowerConnected(followerConnectionId) { }
    onFollowerDisconnected(followerConnectionId) { }

    connect() {
        return new Promise((resolve) => {
            this.#peer = new Peer(this.#gameId)
            this.#peer.on('open', (id) => {
                this.onPeering(id)

                this.#peer.on('connection', (conn) => {
                    if (conn.peer !== this.#gameId && conn.peer.length > 0 && this.onFollowerConnecting(conn.peer)) {
                        conn.on('data', async ({ type, payload }) => {
                            this.onMessage(conn.peer, type, payload)
                        })

                        conn.on('close', (e) => {
                            console.log('conn to follower closed:', e)
                            this.#connections.delete(conn.peer)
                            this.onFollowerDisconnected(conn.peer)
                        })
                        conn.on('error', (e) => console.error('leader conn error:', e))

                        conn.on('open', async () => {
                            this.#connections.set(conn.peer, conn)
                            this.onFollowerConnected(conn.peer)
                        })
                    } else {
                        console.log('connection attempt canceled')
                        conn.close()
                    }
                })

                resolve()
            })
            this.#peer.on('close', () => console.log('leader close')) // todo
            this.#peer.on('disconnected', () => console.log('leader disconnected')) // todo
            this.#peer.on('error', (e) => console.error('leader error:', e))
        })
    }

    async disconnect() {
        this.#connections?.forEach(conn => conn.close())
        this.#peer?.disconnect()
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
    /** @type {import('peerjs').DataConnection} */
    #connection
    /** @type {string} */
    #gameId
    /** @type {Peer} */
    #peer

    constructor(gameId) {
        super()
        this.#gameId = gameId
    }

    connect() {
        return new Promise((resolve) => {
            this.#peer = new Peer()
            this.#peer.on('close', () => console.log('follower close')) // todo
            this.#peer.on('disconnected', () => console.log('follower disconnected')) // todo
            this.#peer.on('error', (e) => console.error('follower error:', e))

            this.#peer.on('open', (id) => {
                this.onPeering(id)

                const conn = this.#peer.connect(this.#gameId)

                conn.on('open', () => {
                    this.#connection = conn

                    conn.on('data', async ({ type, payload }) => {
                        this.onMessage(conn.peer, type, payload)
                    })

                    resolve()
                })

                conn.on('close', () => console.log('follower conn close')) // todo
                conn.on('error', (e) => console.error('follower conn error:', e))
            })
        })
    }

    async disconnect() {
        this.#connection?.close()
        this.#peer?.disconnect()
    }

    async request(type, payload = undefined) {
        this.#connection.send({ type, payload })
    }
}
