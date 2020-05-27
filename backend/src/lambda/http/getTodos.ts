import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId, generateResponse, parseLimitParameter, parseNextKeyParameter } from '../utils'
import { TodoRepository } from '../../dataLayer/TodoRepository'
import { createLogger } from '../../utils/logger'


const logger = createLogger('GetTodos')
const todoRepository = new TodoRepository()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('GetTodos is called: ',event)
  const userId = getUserId(event);
  const limit = parseLimitParameter(event) || 20
  const nextKey = parseNextKeyParameter(event)

  if(!userId) {
    return generateResponse('userId is missing' , 400)
  }

  try {
    const result = await todoRepository.getTodoItems(userId, limit, nextKey)
    logger.info('GetTodos is done:', result)
    return generateResponse( { items: result.Items, nextKey: result.nextKey} , 200)
  } catch(err) {
    logger.error('GetTodos failed:', err)
    return generateResponse('internal server error',500)
  }
}

