import 'source-map-support/register'
import { generateResponse, getUserId } from '../utils'
import { TodoRepository } from '../../dataLayer/TodoRepository'
import { createLogger } from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const logger = createLogger('UpdateTodo')
const todoRepository = new TodoRepository()


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('UpdateTodo is called: ',event)  
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event);
  const validTodo = await todoRepository.todoExists(todoId, userId)

  if(!validTodo) {
    return generateResponse('Todo does not exist',404)
  }

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  if(!updatedTodo.dueDate || !updatedTodo.name ) {
    return generateResponse('dueDate or name is missing' , 400)
  }

  try {
    const result = await todoRepository.updateTodoItem(userId, todoId ,updatedTodo)
    logger.info('UpdateTodo is done',result)
    return generateResponse('',200)
  } catch(err) {
    logger.error('UpdateTodo failed:', err)
    return generateResponse('internal server error',500)
  }
}
