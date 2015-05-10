var html = document.body.innerHTML,

    patternVideo = new RegExp("http?:\\/\\/[^\\s]+\\.mp4", "gi"),
    patternDocs = new RegExp("http?:\\/\\/[^\\s]+\\.pdf", "gi"),
    patternDocs1 = new RegExp("http?:\\/\\/[^\\s]+\\.jpg", "gi"),

    videos = html.match(patternVideo),
    docs = html.match(patternDocs),
    docs1 = html.match(patternDocs1),
    source;

var object = {
    video: parseItem(videos),
    docs: getDocs([docs, docs1]),
    source: source,
    status: "parsed",
    saved: false
};

object = validate(object);

//chrome.storage.sync.clear();
chrome.storage.sync.get("state", function(items) {
    if (items.state == undefined) {
        items.state = [];
    }
    items.state.push(object);
    items.state = removeDuplicates(items.state);
    chrome.storage.sync.set({state: items.state});
});

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

        source = segments[segments.length - 2];
        object.push({
            source: array[i],
            filename: array[i].substr(array[i].lastIndexOf("/") + 1),
            path: segments[segments.length - 2],
            data: null
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
