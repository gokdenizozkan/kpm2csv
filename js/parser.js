class Website {
    static type = "Website";
    static fieldNum = 6;
    static csvHeaders = "title,website,username,password,notes";
    websiteName;
    websiteUrl;
    loginName;
    login;
    password;
    comment;
    setFieldsFromArray(arr) {
        [this.websiteName, this.websiteUrl, this.loginName, this.login, this.password, this.comment] = arr.slice(0, Website.fieldNum);
        for (let i = Website.fieldNum; i < arr.length; i++) {
            this.comment += arr[i];
        }
        this.strip();
    }
    strip() {
        this.websiteName = stripped(this.websiteName);
        this.websiteUrl = stripped(this.websiteUrl);
        this.loginName = stripped(this.loginName);
        this.login = stripped(this.login);
        this.password = stripped(this.password);
        this.comment = stripped(this.comment);
    }
    toCsv() {
        return `${surroundWithQuotes(this.websiteName)},${surroundWithQuotes(this.websiteUrl)},${surroundWithQuotes(this.login)},${surroundWithQuotes(this.password)},${surroundWithQuotes(blankIfUndefined(this.comment))}`;
    }
}

class Application {
    static type = "Application";
    static fieldNum = 5;
    static csvHeaders = "title,website,username,password,notes";
    application;
    loginName;
    login;
    password;
    comment;
    setFieldsFromArray(arr) {
        [this.application, this.loginName, this.login, this.password, this.comment] = arr.slice(0, Application.fieldNum);
        for (let i = Application.fieldNum; i < arr.length; i++) {
            this.comment += arr[i];
        }
        this.strip();
    }
    strip() {
        this.application = stripped(this.application);
        this.loginName = stripped(this.loginName);
        this.login = stripped(this.login);
        this.password = stripped(this.password);
        this.comment = stripped(this.comment);
    }
    toCsv() {
        return `${surroundWithQuotes(this.application)},${surroundWithQuotes(this.login)},${surroundWithQuotes(this.password)},${surroundWithQuotes(blankIfUndefined(this.comment))}`;
    }
}

class Other {
    static type = "Other";
    static fieldNum = 5;
    static csvHeaders = "title,website,username,password,notes";
    accountName;
    loginName;
    login;
    password;
    comment;
    setFieldsFromArray(arr) {
        [this.accountName, this.loginName, this.login, this.password, this.comment] = arr.slice(0, Other.fieldNum);
        for (let i = Other.fieldNum; i < arr.length; i++) {
            this.comment += arr[i];
        }
        this.strip();
    }
    strip() {
        this.accountName = stripped(this.accountName);
        this.loginName = stripped(this.loginName);
        this.login = stripped(this.login);
        this.password = stripped(this.password);
        this.comment = stripped(this.comment);
    }
    toCsv() {
        return `${surroundWithQuotes(this.application)},${surroundWithQuotes(this.login)},${surroundWithQuotes(this.password)},${surroundWithQuotes(blankIfUndefined(this.comment))}`;
    }
}

class Note {
    static type = "Note";
    static fieldNum = 2;
    static csvHeaders = "title,text of note";
    name;
    text;
    setFieldsFromArray(arr) {
        [this.name, this.text] = arr.slice(0, Note.fieldNum);
        for (let i = Note.fieldNum; i < arr.length; i++) {
            this.text += "\n" + arr[i];
        }
        this.strip();
    }
    strip() {
        this.name = stripped(this.name);
        this.text = stripped(this.text);
    }
    toCsv() {
        return `${surroundWithQuotes(this.name)},${surroundWithQuotes(this.text)}`;
    }
}

function blankIfUndefined(str) {
    return str === undefined ? '' : str;
}

function stripped(field) {
    return field.split(": ")[1];
}

function surroundWithQuotes(field) {
    if (count(field, ",") < 1 && (field[0] !== "'" || field[0] !== '"')) {
        return field;
    }
    if (count(field, '"') < 2) {
        return `"${field}"`;
    }
    if (count(field, "'") < 2) {
        return `'${field}'`;
    }
    return null;
}

function count(text, matcher) {
    return (text.match(matcher)||[]).length;
}

function parseHelper(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        let entries = parse(event.target.result);
        let csv = toCsv(entries);
        document.getElementById("csv").innerText = csv;
        navigator.clipboard.writeText(csv);
        forwardToDownload(csv);
    };

    reader.onerror = (event) => {
        alert(event.target.error.name);
    };

    reader.readAsText(file);
}

function parse(text) {
    let blocks = text.split("\r\n---\r\n");

    let entries = [];
    let entry = null;
    for (const block of blocks) {
        let lines = block.split("\r\n");
        if (lines.length < 2) continue;

        let i = 1;
        if (lines[0] !== '' || (lines[0] === '' && lines[2] === '')) {
            let first = lines[0] !== '';
            let line = first ? lines[0] : lines[1];
            switch (line) {
                case "Websites":
                    entry = new Website();
                    break;
                case "Applications":
                    entry = new Application();
                    break;
                case "Other Accounts":
                    entry = new Other();
                    break;
                case "Notes":
                    entry = new Note();
                    break;
            }
            i = first ? i + 1 : i + 2;
        }

        let elements = lines.slice(i, lines.length);
        if (elements.length < 2) continue;
        entry.setFieldsFromArray(elements);
        entries.push(Object.assign(new entry.constructor(), entry));
    }
    return entries;
}

function toCsv(entries, typeToGenerate = Website.prototype) {
    let csv = typeToGenerate.constructor.csvHeaders + "\n";
    entries.filter(e => e.constructor.type === typeToGenerate.constructor.type).forEach(e => csv += e.toCsv() + "\n");
    return csv;
}

function forwardToDownload(data) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpm-export.csv';

    a.click();
}

document.getElementById("input-text").addEventListener("input", (e) => {
    parseHelper(e.target.files[0]);
});