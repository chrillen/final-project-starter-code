import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as uuid from 'uuid'
import { getUserId, generateResponse } from '../utils'
import { TodoRepository } from '../../dataLayer/TodoRepository'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CreateTodo')
const todoRepository = new TodoRepository()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('CreateTodo is called: ',event)
  const userId = getUserId(event);
  
  if(!userId) {
    return generateResponse('userId is missing' , 400)
  }

  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  if(!newTodo.dueDate || !newTodo.name) {
    return generateResponse('dueDate or name is missing' , 400)
  }

  try {
    const newItem = await todoRepository.createTodoItem(uuid.v4(),newTodo, userId)
    logger.info('Create todo is done')
    return generateResponse( { item: newItem }, 201)
  } catch(err) {
    logger.error('DeleteTodo failed:', err)
    return generateResponse('internal server error',500)
  }
}
