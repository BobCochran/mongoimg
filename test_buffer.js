/* Taken by Bob Cochran from this Gist:
 * https://gist.github.com/jfsiii/804225
 * Complete reworking of JS from https://gist.github.com/803410
 * Removes external `request` dependency
 * Caveats:
 * * No error checking
 * * Largely a POC [ed: proof of concept?].
 * `data` URI is accurate, but this code cannot simply be inserted
 * into an `express` app
 */
var http = require('http')
var options = {
    hostname: 'www.nodejs.org',
    port: 80,
    path: '/logo.png',
    method: 'GET'
}
http.request(options, function(res) {

    console.log('STATUS: ' + res.statusCode);

    console.log('HEADERS: ' + JSON.stringify(res.headers));

    var type = res.headers["content-type"]
    var prefix = "data:" + type + ";base64,"
    var body = "";

    res.on('error', function(e) {
        console.log('problem with request: ' + e.message)
        })

    res.setEncoding('binary');

    res.on('end', function () {
            var base64 = new Buffer(body, 'binary').toString('base64'),
                data = prefix + base64;
            console.log(data);
        });
    res.on('data', function (chunk) {
            if (res.statusCode == 200) body += chunk;
        });

}).end()
