const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const app = express();

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
  }
};

initializeDbAndServer();

const convertTodoDbToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
      SELECT 
        *
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%,
        priority = '${priority}',
        status = '${status}';`;
      break;
    case hasPriorityAndCategoryProperties(request.query):
      getTodoQuery = `
      SELECT 
        *
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%,
        priority = '${priority}',
        category = '${category}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
      SELECT 
        *
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%,
        status = '${status}',
        category = '${category}';`;
      break;
    case hasStatusProperties(request.query):
      getTodoQuery = `
          SELECT 
            *
          FROM 
            todo 
          WHERE 
            todo LIKE '%${search_q}%,
            status = '${status}';`;
      break;
    case hasPriorityProperties(request.query):
      getTodoQuery = `
      SELECT 
        *
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%,
        priority = '${priority}',`;
      break;
    case hasCategoryProperties(request.query):
      getTodoQuery = `
      SELECT 
        *
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%,
        category = '${category}';`;
      break;
    default:
      getTodoQuery = `
      SELECT 
        *
      FROM 
        todo 
      WHERE 
        todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT 
    *
  FROM 
    todo 
  WHERE 
    id = ${todoId};`;

  const todoArray = await db.get(getTodoQuery);
  response.send(todoArray);
});

app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 01, 22), "yyyy,mm,dd");
  //const { dueDate } = request.params;
  const getTodoQuery = `
    SELECT 
      * 
    FROM 
      todo 
    WHERE 
      due_date = ${date};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (response, request) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
    INSERT INTO 
      todo (id, todo, priority, status, category, due_date)
    VALUES(
        ${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate}
    );`;

  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "2021-01-12";
      break;
  }

  const previousTodoQuery = `
  SELECT 
    *
  FROM 
    todo 
  WHERE 
    id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const updateTodoQuery = `
    UPDATE 
      todo 
    SET  
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = ${dueDate},
    WHERE 
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
      todo 
    WHERE 
      id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
