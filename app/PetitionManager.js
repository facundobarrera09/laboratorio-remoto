const { Petition } = require('./Petition');
const { EventEmitter } = require('node:events');

class PetitionManager {
    constructor(portConnection) {
        this.portConnection = portConnection;

        this.executingManager = false;
        this.executingPetitions = false;
        this.petitionQueue = [];
        this.petitionInExecution = null;
        this.petitionTimeout = 5000;

        this.emitter = new EventEmitter();
    }

    addPetitionToQueue(petition) {
        console.log('PetitionManager: Adding new petition to queue');
        this.petitionQueue.push(petition);
        this.emitter.emit('new_petition');
    }

    async start(manager = this) {
        if (!manager.executingManager) {
            manager.executingManager = true; 
            manager.emitter.on('new_petition', () => manager.start(this));
        }

        if (!manager.executingPetitions) {
            manager.executingPetitions = true;
            
            while (manager.petitionQueue.length > 0) {
                let nextPetition = manager.petitionQueue.shift();
                manager.#execute(nextPetition);
                await new Promise(r => {
                    setTimeout(r, manager.petitionTimeout);
                    manager.emitter.emit('done_executing');
                });
            }

            manager.executingPetitions = false;
        }
    }

    #execute(petition) {
        console.log('PetitionManager: Executing petition: ', petition);
        this.portConnection.updateControllerConfig(petition.configuration);
        this.petitionInExecution = petition;
    };

    on(event, callback) {
        this.emitter.on(event, callback);
    }
};

exports.PetitionManager = PetitionManager;