![Alt text](logo.png?raw=true 'MEN MVC')

`MEN MVC` is a wrapper framework built on top of Express JS to make web API development with MongoDB, Express and Node much more efficient, time-saving,
and organised by providing you with an application where development architecture and necessary components to build an API are already set up in favour of
MVC pattern as well as offering the additional built-in features such as authentication, caching, etc.
`MEN MVC` is a wrapper framework for Express JS so knowledge of Express JS is required.
It's using TypeScript so you must know TypeScript too.

## Documentation

- http://menmvc.com/

### Installation

- First, you need to install the `create-men-mvc-app` command globally by executing `npm i -g @men-mvc/men-mvc-cli`
- After installing the command, you can run, `create-men-mvc-app {{YOUR_PROJECT_FOLDER}}` replacing the placeholder with your project's folder.

**NOTE**: The command is mainly designed for and tested on the `Mac OS`. If you run into problem running the command on the `Windows`, you can still manually install it as mentioned in the documentation (https://menmvc.com).

### Running the project locally

- Set the config variables for mail, database, etc in the `.env` file or the `environment-specific config file` in the `config` folder
- Then run `npm run dev`
  Your application should be running on http://localhost:8000

### Running the tests

- Set the database URI and other necessary config variables in the `config/test.json` file
- Then run `npm run test`

### Building for production

- `npm run build` will generate the production build which is `dist` folder.
