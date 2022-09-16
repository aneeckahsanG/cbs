Installation
Required: NodeJS
          - Working version: 10.15.3. Higher Node version should be ok, though no tested.

1. npm install -g sequelize-cli
2. cd into project root
3. npm install
4. Rename .env.example to .env and set database credentials, listening interface/port
   If you want to listen on all network interfaces, then remove NET_INTERFACE.
5. sequelize-cli db:create
6. sequelize-cli db:migrate
7. sequelize-cli db:seed:all
8. node ./bin/www 