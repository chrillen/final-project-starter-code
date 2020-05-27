import * as AWS  from 'aws-sdk'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";
import { Key, DocumentClient } from 'aws-sdk/clients/dynamodb';
import { encodeNextKey } from '../lambda/utils';

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)

function createDynamoDBClient() {
  return new XAWS.DynamoDB.DocumentClient()
}

export class TodoRepository {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.TODOS_ID_INDEX){
  }

/**
 * Get all todo items that belongs to the user.
 * @param userId userid of the user that is logged in.
 * @param limit limit number of items to be received.
 * @param nextKey get nextkey if their is any for pagination.
 *
 * @returns all todo items that user has added and nextKey for pagination handling.
 */
 async  getTodoItems(userId: string,limit :number,nextKey :Key) : Promise<any> {
  const result = await this.docClient.query({
    TableName: this.todosTable,
    IndexName: this.todosIndex,
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
 async  todoExists(todoId: string,userId: string) : Promise<TodoItem> {
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
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
 async createTodoItem(todoId: string,newTodo: CreateTodoRequest,userId: string) :Promise<TodoItem> {
    const newItem  =  {
     todoId: todoId,
     name: newTodo.name,
     createdAt: new Date().toISOString(),
     dueDate: new Date(newTodo.dueDate).toISOString(),
     userId: userId,
     done: false
    }
    await this.docClient.put({
      TableName: this.todosTable,
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
   * @param attachmentUrl? Update attachmentUrl of item its optional.
   *
   * @returns Updated todo item.
   */
   async  updateTodoItem(userId: string, todoId: string, 
    updatedTodo: UpdateTodoRequest, attachmentUrl?: string) : Promise<TodoUpdate> {
    const result = await this.docClient.update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        ExpressionAttributeNames: { "#N": "name" },
        UpdateExpression: "set #N=:todoName, dueDate=:dueDate, done=:done, attachmentUrl=:attachmentUrl",
        ExpressionAttributeValues: {
          ":todoName": updatedTodo.name,
          ":dueDate": new Date(updatedTodo.dueDate).toISOString(),
          ":done": updatedTodo.done || false,
          ":attachmentUrl": attachmentUrl || ''
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
   async  deleteTodoItem(todoId :string,userId :string)  {
    await this.docClient.delete({
    TableName: this.todosTable,
    Key: {
      todoId, userId
     }
    }).promise()
  }
}