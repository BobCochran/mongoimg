/* This code attempts to test the GraphicsMagick for Node.js ('gm') utility in a simple way.
 *
 *  If you get this error:
 *
 * { [Error: spawn ENOENT] code: 'ENOENT', errno: 'ENOENT', syscall: 'spawn' }
 *
 * You may need to use this option statement to the gm utility:
 *
 * .options({imageMagick: true})
 *
 */
var MongoClient = require('mongodb').MongoClient  // Driver for connecting to MongoDB
    , format = require('util').format;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var mongoport = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

var fs = require('fs')
var gm = require('gm')

/* Let us see if we can convert an array object which is an image into a buffer,
 * and then resize the image that is in the buffer. We will be a bit involved with this: we want
 * to fetch the image from a MongoDB database collection.
 *
 */

// Connect to the database
MongoClient.connect(format("mongodb://%s:%s/images?journal=true", host, mongoport), function (err, db) {

    if (err) {
        throw err
        return
    }

    console.log("Connected to database server on host " + host + ":" + mongoport)

    db.collection("demoimages", function (err, collection) {
        collection.find({ "fn": "IMG_1786" }, { "_id": 0 }, {})
            .toArray(function (err, docs) {
                if (err) {
                    console.log("A database error occurred while testing the gm utility\n" + err)
                    return err
                }
                else {
                    console.log('image successfully obtained from MongoDB: ' + docs[0].fn)
                    db.close()

                    /* now that we seem to have an image available, let us resize it with gm */

                    var buf1 = new Buffer(docs[0].image, "binary")
                    var fpath = __dirname + '/mongodb_presentation_images' + '/' + docs[0].fn + '.JPG'
                    console.log(fpath)
                    gm(buf1, fpath)
                        .options({imageMagick: true})
                        .resize(600)
                        .toBuffer('JPG', function(err, buffer) {
                            if (err) {

                                return handle(err)
                            }
                            if (!err) {

                                console.log("image from database successfully resized by gm")
                            }
                        })

                }
            })
    })

})