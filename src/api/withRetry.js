const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_RETRIES = 2
const DEFAULT_DELAY_MS = 300

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryable(error) {
  if (!error) return false
  const code = error.code || error.status || ''
  const message = (error.message || '').toLowerCase()
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'FETCH_ERROR', 'ETIMEOUT']

  return (
    retryableCodes.includes(code) ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout')
  )
}

async function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout de red')), ms)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    return result
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function withRetry(fn, options = {}) {
  const retries = options.retries ?? DEFAULT_RETRIES
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  let attempt = 0
  let lastError = null

  while (attempt <= retries) {
    try {
      const result = await withTimeout(fn(), timeoutMs)
      if (result?.error && isRetryable(result.error) && attempt < retries) {
        lastError = result.error
        attempt += 1
        await sleep(delayMs * attempt)
        continue
      }
      return result
    } catch (err) {
      if (isRetryable(err) && attempt < retries) {
        lastError = err
        attempt += 1
        await sleep(delayMs * attempt)
        continue
      }
      throw err
    }
  }

  if (lastError) throw lastError
  throw new Error('Operación fallida tras reintentos')
}
