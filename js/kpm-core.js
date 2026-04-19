(function initKpm2csvCore(globalObject, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    globalObject.kpm2csvCore = api;
}(typeof globalThis !== "undefined" ? globalThis : window, () => {
    class Website {
        static type = "Website";
        static fieldNum = 6;
        static csvHeaders = "website-name,website-url,login-name,login,password,comment";

        websiteName;
        websiteUrl;
        loginName;
        login;
        password;
        comment;

        setFieldsFromArray(arr) {
            [this.websiteName, this.websiteUrl, this.loginName, this.login, this.password, this.comment] = arr.slice(0, Website.fieldNum);
            this.comment = appendOverflow(this.comment, arr.slice(Website.fieldNum));
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
            return csvRow([
                this.websiteName,
                this.websiteUrl,
                this.loginName,
                this.login,
                this.password,
                this.comment
            ]);
        }
    }

    class Application {
        static type = "Application";
        static fieldNum = 5;
        static csvHeaders = "application,login-name,login,password,comment";

        application;
        loginName;
        login;
        password;
        comment;

        setFieldsFromArray(arr) {
            [this.application, this.loginName, this.login, this.password, this.comment] = arr.slice(0, Application.fieldNum);
            this.comment = appendOverflow(this.comment, arr.slice(Application.fieldNum));
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
            return csvRow([
                this.application,
                this.loginName,
                this.login,
                this.password,
                this.comment
            ]);
        }
    }

    class Other {
        static type = "Other";
        static fieldNum = 5;
        static csvHeaders = "account-name,login-name,login,password,comment";

        accountName;
        loginName;
        login;
        password;
        comment;

        setFieldsFromArray(arr) {
            [this.accountName, this.loginName, this.login, this.password, this.comment] = arr.slice(0, Other.fieldNum);
            this.comment = appendOverflow(this.comment, arr.slice(Other.fieldNum));
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
            return csvRow([
                this.accountName,
                this.loginName,
                this.login,
                this.password,
                this.comment
            ]);
        }
    }

    class Note {
        static type = "Note";
        static fieldNum = 2;
        static csvHeaders = "name,text";

        name;
        text;

        setFieldsFromArray(arr) {
            [this.name, this.text] = arr.slice(0, Note.fieldNum);
            this.text = appendOverflow(this.text, arr.slice(Note.fieldNum));
            this.strip();
        }

        strip() {
            this.name = stripped(this.name);
            this.text = stripped(this.text);
        }

        toCsv() {
            return csvRow([this.name, this.text]);
        }
    }

    const entryClasses = [Website, Application, Other, Note];
    const entryTypeClasses = new Map(entryClasses.map((entryClass) => [entryClass.type, entryClass]));
    const sectionHeaders = new Map([
        ["Websites", Website],
        ["Applications", Application],
        ["Other Accounts", Other],
        ["Notes", Note]
    ]);

    function blankIfUndefined(value) {
        return value === undefined || value === null ? "" : String(value);
    }

    function appendOverflow(initialValue, extraLines) {
        const value = blankIfUndefined(initialValue);
        const overflow = extraLines.map((line) => blankIfUndefined(line));

        while (overflow.length > 0 && overflow[overflow.length - 1] === "") {
            overflow.pop();
        }

        if (overflow.length === 0) {
            return value;
        }

        return value ? `${value}\n${overflow.join("\n")}` : overflow.join("\n");
    }

    function stripped(field) {
        const value = blankIfUndefined(field).replace(/^\uFEFF/, "");
        const separatorIndex = value.indexOf(": ");
        return separatorIndex === -1 ? value : value.slice(separatorIndex + 2);
    }

    function escapeCsvField(field) {
        const value = blankIfUndefined(field);
        if (!/[",\n]/.test(value)) {
            return value;
        }

        return `"${value.replace(/"/g, "\"\"")}"`;
    }

    function csvRow(fields) {
        return fields.map((field) => escapeCsvField(field)).join(",");
    }

    function createEmptyEntriesMap() {
        return new Map(entryClasses.map((entryClass) => [entryClass.type, []]));
    }

    function normalizeLineEndings(text) {
        return blankIfUndefined(text)
            .replace(/^\uFEFF/, "")
            .replace(/\r\n?/g, "\n");
    }

    function inferEntryClassFromFields(lines) {
        const candidates = lines
            .map((line) => line.trim().replace(/^\uFEFF/, ""))
            .filter((line) => line.length > 0);

        if (candidates.length === 0) {
            return null;
        }

        const [first, second = ""] = candidates;
        if (first.startsWith("Website name:")) {
            return Website;
        }

        if (first.startsWith("Application:")) {
            return Application;
        }

        if (first.startsWith("Account name:")) {
            return Other;
        }

        if (first.startsWith("Name:") && second.startsWith("Text:")) {
            return Note;
        }

        return null;
    }

    function detectEntryClass(lines) {
        const maxHeaderIndex = Math.min(lines.length, 3);
        for (let index = 0; index < maxHeaderIndex; index += 1) {
            const candidate = lines[index].trim().replace(/^\uFEFF/, "");
            if (!candidate) {
                continue;
            }

            const entryClass = sectionHeaders.get(candidate);
            if (entryClass) {
                return {
                    entryClass,
                    headerIndex: index,
                    hasSectionHeader: true,
                    isUnknownSection: false
                };
            }

            if (!candidate.includes(":")) {
                return {
                    entryClass: null,
                    headerIndex: index,
                    hasSectionHeader: false,
                    isUnknownSection: true
                };
            }
        }

        const inferredEntryClass = inferEntryClassFromFields(lines);
        if (inferredEntryClass) {
            return {
                entryClass: inferredEntryClass,
                headerIndex: -1,
                hasSectionHeader: false,
                isUnknownSection: false
            };
        }

        return {
            entryClass: null,
            headerIndex: -1,
            hasSectionHeader: false,
            isUnknownSection: false
        };
    }

    function parse(text) {
        const blocks = normalizeLineEndings(text).split(/\n-{3,}(?:\n|$)/);
        const entries = createEmptyEntriesMap();
        let activeEntryClass = null;

        for (const block of blocks) {
            if (block.trim() === "") {
                continue;
            }

            const lines = block.split("\n");
            const {
                entryClass,
                headerIndex,
                hasSectionHeader,
                isUnknownSection
            } = detectEntryClass(lines);
            if (entryClass) {
                activeEntryClass = entryClass;
            } else if (isUnknownSection) {
                activeEntryClass = null;
                continue;
            }

            let startIndex = hasSectionHeader ? headerIndex + 1 : 0;
            while (startIndex < lines.length && lines[startIndex].trim() === "") {
                startIndex += 1;
            }

            const elements = lines.slice(startIndex);
            if (!activeEntryClass || elements.length < 2) {
                continue;
            }

            const entry = new activeEntryClass();
            entry.setFieldsFromArray(elements);
            entries.get(activeEntryClass.type).push(entry);
        }

        return entries;
    }

    function toCsv(entries, entryClass) {
        const rows = entries.map((entry) => entry.toCsv());
        return [entryClass.csvHeaders, ...rows].join("\n");
    }

    return {
        Application,
        Note,
        Other,
        Website,
        createEmptyEntriesMap,
        detectEntryClass,
        entryClasses,
        entryTypeClasses,
        normalizeLineEndings,
        parse,
        toCsv
    };
}));
