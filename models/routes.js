'use strict'
module.exports = function(sequelize, DataTypes) {
  /**
   * @swagger
   * definition:
   *  route:
   *    required:
   *      - url
   *    properties:
   *      id:
   *        type: integer
   *        format: int64
   *      url:
   *        type: string
   *  newRoute:
   *    required:
   *      - url
   *    properties:
   *      url:
   *        type: string
   */

  var schema =
    { id:
      { type: DataTypes.BIGINT
      , autoIncrement: true
      , primaryKey: true
      }
    , url:
      { type: DataTypes.STRING
      , allowNull: false
      , unique: 'unq_UrlMethod'
      }
    , method:
      { type: DataTypes.ENUM
        ( 'GET'
        , 'POST'
        , 'PUT'
        , 'PATCH'
        , 'DELETE'
        )
      , allowNull: false
      , defaultValue: 'GET'
      , unique: 'unq_UrlMethod'
      }
    };

  var Route = sequelize
  .define
    ( 'Route'
    , schema
    , { paranoid: true
      , tableName: 'route'
      , singular: 'route'
      , plural: 'routes'
      , classMethods:
        { associate: function(models) {
            Route
              .belongsToMany
                ( models.Role
                , { through: 'routeRoles'
                  , foreignKey: 'routeId'
                  , targetKey: 'routeId'
                  }
                );
          }
        }
      }
    );

  return Route;
};
