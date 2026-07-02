export class ApiError extends Error {
  status?: number
  retryable: boolean
  constructor(message: string, status?: number, retryable = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryable = retryable
  }
}
