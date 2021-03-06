const { EventEmitter } = require('events')

const QueryEvents = {
  QUERY_COMPLETE: 'queryComplete',
  QUERY_ERROR: 'queryError',
  QUEUE_EMPTY: 'queueEmpty'
}

class QueryQueue extends EventEmitter {

  constructor(queryService) {
    super()
    this.queryService = queryService
    this.queue = []
    this.queryHandler = this.start()
  }

  start() {
    this.queryHandler = setInterval(this._readQueue.bind(this))
  }
  
  stop() {
    clearInterval(this.queryHandler)
  }

  addBatch(connectionId, queryBatch) {
    this.queue.push({ connectionId, queryBatch })
  }
  
  _readQueue() {
    const item = this.queue.splice(0, 1)[0]
    if (item) {
      this._handleItem(item)
    } else {
      this.emit(QueryEvents.QUEUE_EMPTY)
    }
  }

  async _handleItem(item) {
    try {
      for(let query of item.queryBatch) {
        const result = await this.queryService.exec(query)
        this.emit(QueryEvents.QUERY_COMPLETE, {
          connectionId: item.connectionId,
          data: result
        })
      }
    } catch (err) {
      this.emit(QueryEvents.QUERY_ERROR, {
        connectionId: item.connectionId,
        error: err
      })
    }
  }

}

module.exports = {
  QueryQueue,
  QueryEvents
}