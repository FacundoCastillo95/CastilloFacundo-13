const express = require("express");
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const http = require("http").Server(app);

const sessionHandler = session({
  secret: 'secreto',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 3_000,
  },
});

app.use(sessionHandler);

app.set("views", "./views");
app.set("view engine", "ejs");

app.get('/', (req, res) => {
  res.render('pages/index')
})

app.get('/login', (request, response) => {
  const { user } = request.query;

  if (!user) {
    return response
      .send('Login failed');
  }else{
    request.session.user = user;
    
    return response
      .render('pages/main', {user : user})
  }
});

app.get('/logout', (request, response) => {
  const {user} = request.query;
  request.session.destroy((error) => {
    if (error) {
      return response
        .send({
          status: 'Logout error',
          body: error,
        });
    }

    return response
      .render('pages/logout', {user : user});
  });
});

//tasklist /fi "imagename eq node.exe" -> lista todos los procesos de node.js activos
//taskkill /pid numpid /f -> mata un proceso por su número de PID

//npm i -g pm2
//npm list -g | grep pm2

// -------------- MODO FORK -------------------
//pm2 start server.js --name="Server1" --watch -- 8081

// -------------- MODO CLUSTER -------------------
//pm2 start server.js --name="Server2" --watch -i max -- 8082

//pm2 list
//pm2 delete id/name
//pm2 desc name
//pm2 monit
//pm2 --help
//pm2 logs
//pm2 flush

// ------------------ NGINX ----------------------
//http://nginx.org/en/docs/windows.html
//start nginx
//tasklist /fi "imagename eq nginx.exe"
//nginx -s reload
//nginx -s quit


//app.use(express.static('public'))

//console.log(parseInt(process.argv[2]))
const PORT = parseInt(process.argv[2]) || 8080

app.get('/datos', (req, res) => {
    console.log(`port: ${PORT} -> Fyh: ${Date.now()}`)
    res.send(`Servidor express <span style="color:blueviolet;">(Nginx)</span> en ${PORT} - <b>PID ${process.pid}</b> - ${new Date().toLocaleString()}`)
})

app.listen(PORT, err => {
    if (!err) console.log(`Servidor express escuchando en el puerto ${PORT} - PID WORKER ${process.pid}`)
})
