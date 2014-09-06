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

//Query for all images in the d750 collection.

exports.find750 = function (callback) {
        db.collection("d750", function (err, collection) {
            collection.find( {}, {"_id" : 0 }, { sort: { "fn" : 1 } } )
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

//Query for all images in the d650 collection.

exports.find650 = function (callback) {
        db.collection("d650", function (err, collection) {
            collection.find( {}, {"_id" : 0 }, { sort: { "fn" : 1 } } )
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

//Query for all images in the d550 collection.

exports.find550 = function (callback) {
        db.collection("d550", function (err, collection) {
            collection.find( {}, {"_id" : 0 }, { sort: { "fn" : 1 } } )
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
     * The code below (exports.findById) is being tested for
     * the demoimages collection of the images database.
     *
     */
exports.findById = function (filename, callback) {
    console.log("The filename value that was passed is " + filename + "\n")
    db.collection("demoimages", function (err, collection) {
        collection.find( { "fn" : filename }, { "_id" : 0 }, {} )
            .toArray(function (err, docs) {
            if (err) {
                console.log("A database error occurred in findById\n" + err)
                return callback(err, null)
            }
                else {

                // Okay, so we found the image in demoimages. Let us see
                // if a smaller resolution image is also in 'd750'.
                db.collection("d750", function (err,collection) {
                    collection.find( { "fn" : { $regex : filename + '*' } }, {"_id" : 0}, { sort: { "fn" : 1 } } )
                        .toArray(function (err, docs2) {
                            if (err) {
                                return callback(err, null)
                            }
                            else {
                                console.log('Image queried from deomoimages collection: ' + docs[0].fn)
                                console.log('Image queried from d750 collection: ' + docs2[0].fn)
                                console.log('Going to the callback now! ')
                                callback(null, docs, docs2)
                            }
                        })
                })
                //console.log(docs[0].fn)
                //callback(null, docs, docs2)
            }
        })
    });
};

})