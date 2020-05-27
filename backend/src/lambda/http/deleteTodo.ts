import 'source-map-support/register'
import { generateResponse, getUserId } from '../utils'
import { TodoRepository } from '../../dataLayer/TodoRepository'
import { createLogger } from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const logger = createLogger('DeleteTodo')
const todoRepository = new TodoRepository()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('DeleteTodo is called: ',event)
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event);
  const validTodo = await todoRepository.todoExists(todoId, userId)

  if(!validTodo) {
    return generateResponse('Todo does not exist',404)
  }
  
  try {
    await todoRepository.deleteTodoItem(todoId, userId)
    logger.info('DeleteTodo is done')
    return generateResponse('',204)
  } catch(err) {
    logger.error('DeleteTodo failed:', err)
    return generateResponse('internal server error',500)
  }
}
