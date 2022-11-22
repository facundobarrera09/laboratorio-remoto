class ControllerConfig {
    constructor(config) {
        this.updateConfig(config);
    }

    updateConfig(config) {
        this.rele1 = config['rele1'];
        this.rele2 = config['rele2'];
        this.rele3 = config['rele3'];
        this.rele4 = config['rele4'];
        this.rele5 = config['rele5'];
    }
};

exports.ControllerConfig = ControllerConfig;