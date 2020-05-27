import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { generateResponse, getSignedUrl, getUserId } from '../utils'
import { TodoRepository } from '../../dataLayer/TodoRepository'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'

const logger = createLogger('GenerateUploadUrl')
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const bucketName = process.env.TODO_IMAGES_S3_BUCKET
const todoRepository = new TodoRepository();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('GenerateUploadUrl is called: ',event)
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event);
  const validTodo = await todoRepository.todoExists(todoId, userId)

  if(!validTodo) {
    return generateResponse('Todo does not exist',404)
  }

  const signedUrl = getSignedUrl(bucketName, todoId, parseInt(urlExpiration))
  const item = validTodo as UpdateTodoRequest

  try {
    await todoRepository.updateTodoItem(userId,todoId,item, `https://${bucketName}.s3.amazonaws.com/${todoId}` )
    logger.info('GenerateUploadUrl is done')
    return generateResponse( { uploadUrl: signedUrl } ,200);
  } catch(err) {
    logger.error('GenerateUploadUrl failed:', err)
    return generateResponse('internal server error',500)
  }
}

