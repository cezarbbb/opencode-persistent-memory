import { CAPACITY } from "../core/constants.js"

export type BufferedMessage = {
  role: string
  content: string
  timestamp: number
}

export class MessageBuffer {
  private messages: BufferedMessage[] = []

  push(msg: BufferedMessage): void {
    this.messages.push(msg)
    if (this.messages.length > CAPACITY.MAX_BUFFER_MESSAGES) {
      this.messages = this.messages.slice(-Math.floor(CAPACITY.MAX_BUFFER_MESSAGES * 0.8))
    }
  }

  drain(): BufferedMessage[] {
    const copy = [...this.messages]
    this.messages = []
    return copy
  }

  get size(): number {
    return this.messages.length
  }

  peek(): BufferedMessage[] {
    return [...this.messages]
  }
}
