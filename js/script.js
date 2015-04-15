/*window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024*1024, function(grantedBytes) {
    window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
}, function(e) {
    console.log('Error', e);
});

function onInitFs(fs) {
    var dirReader = fs.root.createReader();

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
        dirReader.readEntries (function(results) {
            console.log(results);
        }, errorHandler);
    };

    readEntries(); // Start reading dirs.
}

function errorHandler(e) {
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    }

    console.log('Error: ' + msg);
}*/

var html = document.body.innerHTML;

var patternVideo = new RegExp("http?:\\/\\/[^\\s]+\\.mp4", "gi");
var patternDocs = new RegExp("http?:\\/\\/[^\\s]+\\.pdf", "gi");
var patternDocs1 = new RegExp("http?:\\/\\/[^\\s]+\\.jpg", "gi");

var videos = html.match(patternVideo),
    docs = html.match(patternDocs),
    docs1 = html.match(patternDocs1);

var object = {
    video: parseItem(videos),
    docs: getDocs([docs, docs1])
};

object = validate(object);

//chrome.storage.sync.set({state: []});
chrome.storage.sync.get("state", function(items) {
    items.state.push(object);
    chrome.storage.sync.set({state: items.state});
});

// TODO start here...

function getDocs(array) {
    var object = [];

    for (var i = 0; i < array.length; i++) {
        if (array[i]) {
            object.push.apply(object, parseItem(array[i]));
        }
    }

    return object;
}

function parseItem(array) {
    var object = [];

    for (var i = 0; i < array.length; i++) {
        var segments = array[i].split("/");

        object.push({
            source: array[i],
            filename: array[i].substr(array[i].lastIndexOf("/") + 1),
            path: segments[segments.length - 2]
        });
    }

    return object;
}

function validate(array) {
    var path;

    for (var i = 0; i < array.video.length; i++) {
        if (!array.video[i].source || !array.video[i].path) {
            throw new ValidationException(array.video[i].filename);
        } else {
            if (!path) {
                path = array.video[i].path;
            } else if (path !== array.video[i].path) {
                throw new ValidationException(array.video[i].path);
            }
        }
    }

    var docs = [];
    for (i = 0; i < array.docs.length; i++) {
        if (array.docs[i].path === path) {
            docs.push(array.docs[i]);
        }
    }

    array.docs = removeDuplicates(docs);

    return array;
}

function removeDuplicates(object) {
    var i,
        result = [],
        temp = {};

    for (i = 0; i < object.length; i++) {
        temp[object[i].source] = 0;
    }
    for (i in temp) {
        result.push(i);
    }

    for (i = 0; i < result.length; i++) {
        for (var j = 0; j < result.length; j++) {
            if (result[i] == object[j].source) {
                result[i] = object[j];
            }
        }
    }
    return result;
}

function ValidationException(value) {
    this.value = value;
    this.message = " Wrong type";
    this.toString = function() {
        return this.value + this.message
    };
}
