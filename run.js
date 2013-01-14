var express          = require('express')
   ,app              = express()
   ,staticMiddleware = express.static(__dirname + '/www');

app.configure(function() {
    app.use(staticMiddleware);
});
console.log("server run at localhost:3000");
app.listen(3000);
