/* This code was taken from Paul Robert's blog entry at
 * http://coding.paulandkana.com/p=12
 * Heavily edited to use a different host and database
 * and to change the export.saves function
 *
 * Changes were made by Robert Cochran. Bob can be emailed on
 * r2cochran2@gmail.com.
 *
 */

// database connection variables

var MongoClient = require('mongodb').MongoClient  // Driver for connecting to MongoDB
    , format = require('util').format;

var fs = require('fs')

var MongoBinData = require('mongodb').Binary

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var mongoport = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

// Connect to the database
MongoClient.connect(format("mongodb://%s:%s/roberts?journal=true", host, mongoport), function (err, db) {

    if (err) {
        throw err
        return
    }

    console.log("Connected to database server on host " + host + ":" + mongoport)

exports.findAll = function (callback) {
    db.collection("articles", function (err, collection) {
        collection.find( {}, {"_id" : 0 }, { sort: {"idt" : 1 } } )
            .toArray(function (err, docs) {
                if (err) {
                    return callback(err, null)
                }
                else {
                    docs.forEach(function (entry) {
                        console.log(entry.author + " " + entry.content)
                    })
                    callback(null, docs)
                }
            });
    });
};

exports.findById = function (id, callback) {
    db.collection("articles", function (error, collection) {
        collection.findOne({_id: new ObjectID(id)}, callback);
    });
};
/* Save the form content from index.html to the Mongodb database.
 * We need to provide a date field for each document and an _id
 */
exports.save = function (t_id, author, content, t_path, t_size, t_image, callback) {
    var idt = new Date();

    if (t_path && t_size) {
        var data = fs.readFileSync(t_path);
        var image = new MongoBinData(data);
        var iauthor = author
        var icontent = content
        var itype = "image/jpeg"
        var ilen = t_size
        var iname = t_image
    }

    console.log("The size of the image is " + ilen)

    db.collection("articles", function (error, collection) {
        collection.save({ "idt" : idt,
                          "img" : image,
                          "author" : iauthor,
                          "content" : icontent,
                          "im_typ" : itype,
                          "im_len" : ilen,
                          "im_name" : iname}, { w:1 }, callback);
    });
};
})