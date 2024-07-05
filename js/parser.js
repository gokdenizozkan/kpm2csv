class Website {
    static fieldNum = 6;
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
}

class Application {
    static fieldNum = 5;
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
}

class Other {
    static fieldNum = 5;
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
}

class Note {
    static fieldNum = 2;
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
}

function stripped(field) {
    return field.split(": ")[1];
}

function parse(text) {
    let blocks = text.split("\r\n---\r\n");

    let entries = [];
    let entry;
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
        entry.setFieldsFromArray(lines.slice(i, lines.length))
        entries.push(entry);
    }
    return entries;
}