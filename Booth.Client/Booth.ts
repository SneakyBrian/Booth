module booth {

    var client: Client;
    
    export function init(boothName:string){
        client = new Client(boothName);
    } 

    export function join() {
        client.join();
    }
}  