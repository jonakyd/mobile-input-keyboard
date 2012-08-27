var express          = require('express')
  , app              = express()
  , staticMiddleware = express.static(__dirname + '/www');

app.configure(function() {
    app.use(staticMiddleware);
});
app.listen(3000);