import { getHeader, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { invalidJson, payloadTooLarge } from '#server/common/errors/common.errors'
import { BODY_BYTES_MAX } from '@shared/contract/http'
import { CONNECTION_CLOSE, TEXT_ENCODING } from './constants'
import { SERVER_HEADERS } from './headers'

const rejectLargeBody = (event: H3Event): never => {
  setResponseHeader(event, SERVER_HEADERS.CONNECTION, CONNECTION_CLOSE)
  event.node.req.resume()
  throw payloadTooLarge()
}

export const readJsonBody = async (event: H3Event): Promise<unknown> => {
  const request = event.node.req

  if (Number(getHeader(event, SERVER_HEADERS.CONTENT_LENGTH)) > BODY_BYTES_MAX) {
    return rejectLargeBody(event)
  }

  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)

    size += buffer.byteLength

    if (size > BODY_BYTES_MAX) {
      return rejectLargeBody(event)
    }

    chunks.push(buffer)
  }

  try {
    return JSON.parse(new TextDecoder(TEXT_ENCODING, { fatal: true }).decode(Buffer.concat(chunks)))
  } catch {
    throw invalidJson()
  }
}
