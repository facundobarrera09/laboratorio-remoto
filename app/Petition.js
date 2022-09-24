class Petition {
    constructor(origin, configuration) {
        this.origin = origin;
        this.configuration = configuration;
    }

    get getOrigin() {
        return this.origin;
    }
    get getConfiguration() {
        return this.configuration;
    }
    set setOrigin(origin) {
        this.origin = origin;
    }
    set setConfiguration(configuration) {
        try {
            this.configuration = JSON.parse(configuration);
        } catch (e) {
            throw e;
        }
    }
};

exports.Petition = Petition;