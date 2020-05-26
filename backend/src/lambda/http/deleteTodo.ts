import 'source-map-support/register'
import { generateResponse, getUserId } from '../utils'
import { todoExists, deleteTodoItem } from '../../dataLayer/todoRepository'
import { createLogger } from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const logger = createLogger('DeleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('DeleteTodo is called: ',event)
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event);
  const validTodo = await todoExists(todoId, userId)

  if(!validTodo) {
    return generateResponse('Todo does not exist',404)
  }
  
  try {
    await deleteTodoItem(todoId, userId)
    logger.info('DeleteTodo is done')
    return generateResponse('',204)
  } catch(err) {
    logger.error('DeleteTodo failed:', err)
    return generateResponse('internal server error',500)
  }
}
