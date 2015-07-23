module booth {

    export class Logger {

        private _logHandler: (message:string) => void;

        public set logHandler(logHandler: (message: string) => void) {
            this._logHandler = logHandler;
        }

        public get logHandler() {
            return this._logHandler;
        }

        public log(message: string) {

            if (this._logHandler) {
                this._logHandler(message);
            }

            console.log(message);
        }

    }
} 