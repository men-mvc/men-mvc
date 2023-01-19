![Alt text](logo.png?raw=true 'MEN MVC')

`MEN MVC` is a wrapper framework built on top of Express JS to make web API development with MongoDB, Express and Node much more efficient, time-saving, and organised by providing you with an application where development architecture and necessary components to build an API are already set up in favour of MVC pattern as well as offering the additional built-in features such as authentication, caching, etc. MEN MVC is a wrapper framework for Express JS so knowledge of Express JS is required. It's using TypeScript so you must know TypeScript too.

## Documentation
- http://www.menmvc.com.s3-website.eu-west-2.amazonaws.com/

### Running the project locally
- Install the dependencies - `npm i -f`
- Set the config variables for mail, database, etc in the `.env` file or the `environment-specific config file` in the `config` folder
- Then run `npm run dev` 
Your application should be running on http://localhost:8000

### Running the tests
- Set the database URI and other necessary config variables in the `config/test.json` file
- Then run `npm run test`

### Building for production
- `npm run build` will generate the production build which is `dist` folder.
