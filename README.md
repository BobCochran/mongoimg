## Synopsis

mongoimg is a node.js application that provides code for storing images in MongoDB database collections, and
querying for and displaying images on actual web pages. This content was presented to the "MongoDC Monthly Meetup -
MD Edition" on August 20, 2014.

## Code Example

To add images to MongoDB using a method based on synchronous reading of .jpg image files, start app.js from any
terminal window:

node app.js

This launches a web server that listens on port 3000 of your machine.

In a web browser, bring up the content upload form:

http://localhost:3000/

You can add images in this way.

Article2.js acts as a data access object and you can easily change the database and collection names.

To add 1 to n images to a database collection, first edit the Filename column in the file fn_list.txt. Add the
filenames you wish to upload as a batch.

Then run 'populate_images_demo_mongodb_v1.js' in a terminal window like this:

node populate_images_demo_mongodb_v1.js 1 2

This tells the script to add the first and second images listed in the file fn_list.txt. The arguments '1 2'
are the line numbers of the file names you want to upload, excluding the heading.

node populate_images_demo_mongodb_v1.js uses Node's fs.createReadStream() API and in this version, the script
is broken: images do not upload to MongoDB correctly. This is likely due to poor implementation by me. If you can
offer suggestions for improving it, please feel free to email me. Or, go straight ahead and do a pull request with
corrected code.

You can easily change the target database collection in the script.

##Displaying Images On A Web Page

If you used the web form method of storing pictures, run:

node app.js

then in your browser go to

http://localhost:3000/articles

If you used the batch method (e.g. `node populate_images_demo_mongodb_v1.js 1 2`), run:

node app2.js

then in your browser go to

http://localhost:3000/articles

## Motivation

This was done to show how to store images into MongoDB collections using the first method. I was also hoping for
help in fixing the bugs that evidently exist in the Node script 'populate_images_demo_mongodb_v1.js'.

## Installation

On Mac or the Unix, you must have a recent version of Node.js installed. I used v0.10.30 downloaded from
nodejs.org for the Meetup demonstration.

The next step is to have npm install the dependency modules for this project. From a terminal window,
cd into the 'mongoimg' directory and run:

npm install

and npm will read the package.json file and install all the dependencies listed in it.

## API Reference

To understand how the scripts work, first read app.js. Then read Article2.js.

MongoDB, the company, supports an API driver for Node.js. It is called 'mongodb'. Documentation is available on the
web:

http://docs.mongodb.org/ecosystem/drivers/node-js/

What I am doing is an attempt to build a "MongoDB/Express.js/Angular.js/Node.js" web application. This is called the
"MEAN stack" for short. One of the best books I am reading on the subject is "Getting MEAN" by Simon Holmes. It is
currently available from Manning Publications as a "Manning Early Access Program" book.


## Contributors

Contributions are greatly welcomed. Feel free to do a pull request. You can also open an issue if you prefer, with
advice for improving this product.

## License

The MIT License (MIT)

Copyright (c) 2014 Robert Cochran

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
