import * as AWS  from 'aws-sdk'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";
import { Key } from 'aws-sdk/clients/dynamodb';
import { encodeNextKey } from '../lambda/utils';

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosIndex = process.env.TODOS_ID_INDEX


/**
 * Get all todo items that belongs to the user.
 * @param userId userid of the user that is logged in.
 * @param limit limit number of items to be received.
 * @param nextKey get nextkey if their is any for pagination.
 *
 * @returns all todo items that user has added and nextKey for pagination handling.
 */
export async function getTodoItems(userId: string,limit :number,nextKey :Key) : Promise<any> {
  const result = await docClient.query({
    TableName: todosTable,
    IndexName: todosIndex,
    Limit: limit,
    ExclusiveStartKey: nextKey,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ProjectionExpression:'todoId,createdAt,#name,dueDate,done,attachmentUrl',
    ExpressionAttributeNames: {
      '#name': 'name'
    },    
    ScanIndexForward: false
  }).promise()
  return  { 
    Items: result.Items as TodoItem[], nextKey:  encodeNextKey(result.LastEvaluatedKey)
  }
}


/**
 * valides if the todo item exists
 * @param todoId id of the todo item
 * @param userId userid of the user that is logged in.
 *
 * @returns todoItem if it exists otherwise its undefined
 */
export async function todoExists(todoId: string,userId: string) : Promise<TodoItem> {
    const result = await docClient
      .get({
        TableName: todosTable,
        Key: {
          todoId, userId
        }
      })
      .promise()
      return result.Item as TodoItem ?? undefined
  }


/**
 * Creates the todo item
 * @param todoId id of the todo item
 * @param newTodo object with the new item data
 * @param CreateTodoRequest object we get from client with the data.
 * @param bucketName name of the bucket for generating the url attachment.
 * @param userId for connecting the todo to the correct user.
 *
 * @returns promise with the newItem created.
 */
export async function createTodoItem(todoId: string,newTodo: CreateTodoRequest,bucketName: string,userId: string) :Promise<TodoItem> {
    const newItem  =  {
     todoId: todoId,
     name: newTodo.name,
     createdAt: new Date().toISOString(),
     dueDate: new Date(newTodo.dueDate).toISOString(),
     userId: userId,
     done: false,
     attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    }
    await docClient.put({
      TableName: todosTable,
      Item: newItem
    }).promise()
    newItem.userId = undefined;
    return newItem as TodoItem
  }
  
  /**
   * Updates the todo item based on the Id
   * @param todoId id of the todo item
   * @param userId id of the user item
   * @param updatedTodo updatedTodo item with the changes.
   *
   * @returns Updated todo item.
   */
  export async function updateTodoItem(userId: string, todoId: string, updatedTodo: UpdateTodoRequest) : Promise<TodoUpdate> {
    const result = await docClient.update({
        TableName: todosTable,
        Key: { userId, todoId },
        ExpressionAttributeNames: { "#N": "name" },
        UpdateExpression: "set #N=:todoName, dueDate=:dueDate, done=:done",
        ExpressionAttributeValues: {
          ":todoName": updatedTodo.name,
          ":dueDate": new Date(updatedTodo.dueDate).toISOString(),
          ":done": updatedTodo.done
      },
      ReturnValues: "UPDATED_NEW"
    })
    .promise()
    return result.$response.data as TodoUpdate ?? undefined
  }
  /**
   * Deletes the todo item based on the Id
   * @param todoId id of the todo item
   * @param userId id of the user item

   *
   * @returns nothing
   */
  export async function deleteTodoItem(todoId :string,userId :string)  {
    await docClient.delete({
    TableName: todosTable,
    Key: {
      todoId, userId
     }
    }).promise()
  }