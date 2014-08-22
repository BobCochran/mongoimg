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
MongoClient.connect(format("mongodb://%s:%s/images?journal=true", host, mongoport), function (err, db) {

    if (err) {
        throw err
        return
    }

    console.log("Connected to database server on host " + host + ":" + mongoport)

// Query for all images on the database

exports.findAll = function (callback) {
    db.collection("demoimages", function (err, collection) {
        collection.find( {}, {"_id" : 0 }, { sort: {"fn" : 1 } } )
            .toArray(function (err, docs) {
                if (err) {
                    return callback(err, null)
                }
                else {
                    docs.forEach(function (entry) {
                        console.log(entry.fn)
                    })
                    callback(null, docs)
                }
            });
    });
};

//Query for images which contain the string 'resized' in the document's
// "im_name" field

 exports.findRes = function (callback) {
        db.collection("demoimages", function (err, collection) {
            collection.find( { "fn" : { $regex: 'resized*' } }, {"_id" : 0 }, { sort: { "fn" : 1 } } )
                .toArray(function (err, docs) {
                    if (err) {
                        return callback(err, null)
                    }
                    else {
                        docs.forEach(function (entry) {
                            console.log(entry.fn)
                        })
                        callback(null, docs)
                    }
                });
        });
    };

    /*
     * The code below (exports.findById) does not work for
     * the demoimages collection of the images database.
     *
     */
exports.findById = function (id, callback) {
    db.collection("demoimages", function (error, collection) {
        collection.findOne({_id: new ObjectID(id)}, callback);
    });
};

})