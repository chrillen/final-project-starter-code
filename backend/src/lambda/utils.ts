import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";
import * as AWS  from 'aws-sdk'

// Global variables that can be reused here.
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

/**
 * Get presigned url that has upload rights.
 * @param bucketName name of S3 bucket
 * @param key of the file in s3
 * @param expires the expiration time of the url 
 *
 * @returns presignedUrl
 */
export function getSignedUrl(bucketName: string, key: string, expires: number) : string {
  return s3.getSignedUrl('putObject', {
  Bucket: bucketName,
  Key: key,
  Expires: expires })
}

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

/**
 * Generate response for AWS Lambda
 * @param payload you want to send back to client
 * @param statusCode http status code you want to send back
 *
 * @returns full payload to sendback to client.
 */
export function generateResponse(payload :any, statusCode :number) : any {
  const data = (statusCode >= 400) ? { error: payload }  : payload
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },    
    body: (payload === '' ) ? payload : JSON.stringify(data)
  }
}

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 *
 * @returns {number} parsed "limit" parameter
 */
export function parseLimitParameter(event) {
  const limitStr = getQueryParameter(event, 'limit')
  if (!limitStr) {
    return undefined
  }

  const limit = parseInt(limitStr, 10)
  if (limit <= 0) {
    throw new Error('Limit should be positive')
  }

  return limit
}

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 *
 * @returns {Object} parsed "nextKey" parameter
 */
export function parseNextKeyParameter(event) {
  const nextKeyStr = getQueryParameter(event, 'nextKey')
  if (!nextKeyStr) {
    return undefined
  }

  const uriDecoded = decodeURIComponent(nextKeyStr)
  return JSON.parse(uriDecoded)
}

/**
 * Get a query parameter or return "undefined"
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @param {string} name a name of a query parameter to return
 *
 * @returns {string} a value of a query parameter value or "undefined" if a parameter is not defined
 */
export function getQueryParameter(event, name) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

/**
 * Encode last evaluated key using
 *
 * @param {Object} lastEvaluatedKey a JS object that represents last evaluated key
 *
 * @return {string} URI encoded last evaluated key
 */
export function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}