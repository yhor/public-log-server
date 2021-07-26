const swaggerJSDoc = require('swagger-jsdoc');

process.env.SCHEMES = process.env.SCHEMES || 'http';
process.env.BASE_PATH = process.env.BASE_PATH || '/';

// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
const swaggerDefinition = {
  openapi: "3.0.3",
    info: {
      title: '로그서버',
      version: '1.0.0',
      description: `로그서버`
    },
    components: {
      securitySchemes: {
        Access_Token: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
      schemas: {
        success: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        totalCount: {
          properties: {
            totalCount: { type: "integer" },
          },
        },
      },
      responses: {
        All: {
          200: {
            $ref: "#/components/responses/OK",
          },
          400: {
            $ref: "#/components/responses/BadRequest",
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
          500: {
            $ref: "#/components/responses/InternalServerErrors",
          },
        },
        OK: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: { type: "object" },
                },
              },
              example: {
                success: true,
                message: "",
              },
            },
          },
        },
        BadRequest: {
          description: "BadRequest",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "메세지 내용" },
                },
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "메세지 내용" },
                },
              },
            },
          },
        },
        InternalServerErrors: {
          description: "InternalServerErrors",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "메세지 내용" },
                },
              },
            },
          },
        },
      },
    },
    definitions: {
      success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true},
          message: { type: "string", example: '등록성공'},
          data: { type: "string", example: null},
        }
      },
      logInsert : {
        type: "object",
        required: [ "project", "log" ],
        properties: {
          project : { type: "string", example: "프로젝트" },
          log: { type: "string", example: "로그" }
        }
      }
    }
};


const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'] 
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
    swaggerSpec,
}