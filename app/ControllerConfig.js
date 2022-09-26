class ControllerConfig {
    constructor(config) {
        this.updateConfig(config);
    }

    updateConfig(config) {
        this.rele1 = config['rele1'];
        this.rele2 = config['rele2'];
    }
};

exports.ControllerConfig = ControllerConfig;