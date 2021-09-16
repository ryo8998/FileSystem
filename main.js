
const config = {
    user:"ryo8998",
    inputTarget:document.getElementById("cli-input"),
    outputTarget: document.getElementById("cli-output-container"),
}
////////////Entryクラス(File/Directory)////////////////////////
class Entry{　//親クラス
    constructor(parent,entryName){
        this.parent = parent;
        this.entryName = entryName;
        this.updatedDate = new Date();
        this.next = null;
        this.prev = null;
    }
    
    getName(hiddenFile){
        if(hiddenFile) {return this.entryName;}
        return this.isHidden? "": this.entryName;
    }
    toString(){
        // サブクラスで実装/
    }
    printList(){
        // サブクラスで実装/
    }
    getThisDir(){
        // サブクラスで実装/
    }
    createDeepCopy(){
        // サブクラスで実装/
    }
}


class File extends Entry{
    constructor(parent,entryName){
        super(parent,entryName)
        this.isHidden = this.entryName.startsWith(".");
    }
    toString(){return `File Name: ${this.entryName}   Last UpdatedAt : ${this.updatedDate.toLocaleDateString()}`}
    getThisDir(){throw Error(`${this.entryName} is not directory`)}
    printList(){ return this.entryName}
    createDeepCopy(){
        let copiedFile = new File(this.parent,this.entryName)
        copiedFile.updateDate = new Date();
        return copiedFile;
    }
    updateDate(){this.updatedDate = new Date()}    
}

class Directory extends Entry{
    constructor(parent,entryName){
        super(parent,entryName);
        this.childNodes = new LinkedList();
    }
    toString(){return this.entryName}
    getThisDir(){return this}
    printList(reverse,hiddenFile){
        let result = "";
        if(reverse){
            let iterator = this.childNodes.tail;
            while(iterator){
            result += iterator.getName(hiddenFile) + "  ";
            iterator = iterator.prev;
            }
        return result; 
        } 
        let iterator = this.childNodes.head;
        while(iterator){
            result += iterator.getName(hiddenFile) + "  ";
            iterator = iterator.next;
            }
        return result; 
    }
    createDeepCopy(){
        let copiedDir = new Directory(this.parent,this.fileName)
        copiedDir.updateDate = new Date();
        copiedDir.childNodes = this.childNodes.deepCopy()
        return copiedDir;
    }
    makeDirectory(dirName){
        if(this.childNodes.includes(dirName)) throw Error(`There is already ${dirName}`);
        this.childNodes.addLast(new Directory(this,dirName))
    }
    updateFileDate(fileName){
        if(this.childNodes.includes(fileName)){
            let targetFile =  this.childNodes.getTargetEntry(fileName);
            targetFile.updateDate();
            return 
        }
        this.childNodes.addLast(new File(this,fileName))
    }
    deleteEntry(entryName){return  this.childNodes.deleteTarget(entryName)}
    getAbsolutePath(){
        let currentDir = this;
        let result = "";
        while(currentDir){
            result = currentDir.getName() + "/" + result;
            currentDir = currentDir.parent;
        }
        return result;
    }
    addEntry(entry){this.childNodes.addLast(entry)}
}

//////LinkedListデータ構造//////////

class LinkedList{
    constructor(){
        this.head = null;
        this.tail = null;
    }
  
    addLast(entry){
        if(this.tail===null){
            this.tail = entry;
            this.head = this.tail;
            return;
        }
        this.tail.next = entry;
        entry.next = null;
        entry.prev = this.tail;
        this.tail = entry;
    };

    deleteTarget(targetName){
        if(this.head === null) return null;
        if(this.head.entryName === targetName){
            let temp = this.head;
            this.head = this.head.next;
            temp.next = null;
            return temp;
        }
        let iterator = this.head;
        while(iterator.next){
            if(iterator.next.entryName===targetName){
                let temp = iterator.next;
                iterator.next = iterator.next.next;
                temp.next = null;
                return temp;
            }
            iterator = iterator.next
        }
        return null;
    }

    includes(targetName){
        if(this.head===null) return false;
        let iterator = this.head;
        while(iterator){
            if(iterator.entryName===targetName) return true;
            iterator = iterator.next;
        }
        return false;
    }

    getTargetEntry(targetName){
        if(this.head===null) return null;
        let iterator = this.head;
        while(iterator){
            if(iterator.entryName===targetName) return iterator;
            iterator = iterator.next;
        }
        return null;
    }

    deepCopy(){
        let copiedList = new LinkedList();
        let iterator = this.head;
        while(iterator != null){
            if(iterator instanceof File){
                copiedList.addLast(new File(iterator.parent,iterator.entryName));
            }
            if(iterator instanceof Directory && iterator.childNodes.head === null){
                copiedList.addLast(new Directory(iterator.parent,iterator.entryName));
            }
            if(iterator instanceof Directory){
                //DirectoryかつchildNodeがあれば再帰的に呼び出す
                iterator.childNodes.deepCopy()
            }
            iterator = iterator.next;
        }
        return copiedList;
    }
}
///////////File System rootとcurrentDirを保持し、entry間をtraverseする//////////////

class FileSystem{

    constructor(){
        // もしすでに一度newされていたら、インスタンス生成はせず一度生成したインスタンスの参照を返す
        const instance = this.constructor.instance;
        if(instance){ return instance}
        this.instance = this;
        this.root = new Directory(null,"root");
        this.currentDir = this.root;
    }

    traverse(currentDir,path){
        if(path.length===0) return currentDir
        if(currentDir===null) throw Error(`No such file or directory`);
        return this.traverse(currentDir.childNodes.getTargetEntry(path.shift()),path)

    }

}
///////////Commandクラス　各コマンド自体をクラス化、コマンド追加時は新しいクラスを作り、CommandCreaterに追加する/////////////

class Command{ //親クラス
    constructor(fileSystem){
        this.fileSystem = fileSystem;
        this.executeAt = null;
        this.option = [];
        this.path = [];
        this.isAbsolutePath = false;
    };
    execute(inputString){
        //rmのcomfirmationが入力が入ってきた場合は、1回目で保持していたコマンドを維持する
        this.inputString = inputString==='y'?this.inputString:inputString;
        //親クラスで処理の流れをテンプレート化する
        this.parse()
        this.validate();
        this.traverse();
        return this.doCommand();
    }
    parse(){
        //一般的なparseは親クラスに実装。個々のコマンドで追加で必要なparseはサブクラスで実装
        this.parsedInputStringArr  = Parser.split(this.inputString);
        this.option = Parser.setOption(this.parsedInputStringArr.slice(1));
        this.path = Parser.setPath(this.parsedInputStringArr.slice(1),this.option)
        this.isAbsolute();
    }
    isAbsolute(){
        if(this.path.length===0) return;
        if(this.path[0] === ""){
        this.isAbsolutePath = true;
        this.path.shift();
        }else{
            this.isAbsolutePath = false;
        };
    }
    
    traverse(){
        //一般的なtraverseは親クラスに実装(再帰呼び出し)。個々のコマンドで追加で必要なtraverseはサブクラスで実装
        if(this.isAbsolutePath){
            this.executeAt = this.fileSystem.traverse(this.fileSystem.root,this.path)
            return 
        }
        this.executeAt = this.fileSystem.traverse(this.fileSystem.currentDir,this.path)
    }
    validate(){
        // サブクラスで実装/
    }
    doCommand(){
        // サブクラスで実装/
    }
}



class Ls extends Command{
    constructor(fileSystem){
        super(fileSystem)
        this.showAll = false;
        this.reverse = false;
    }
    setOptions(){
        //プロパティ初期化
        this.showAll = false;
        this.reverse = false;
        this.option.forEach(ele=>{
            this.showAll = this.showAll? this.showAll: ele.indexOf('a') !== -1;
            this.reverse = this.reverse? this.reverse: ele.indexOf('r') !== -1;
        })
    }
    doCommand(){
        this.setOptions()
        return this.executeAt.printList(this.reverse,this.showAll) 
    }
}


class Mkdir extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    parse(){
        super.parse();
        this.dirName = this.path.pop();
    }
    validate(){
        if(this.inputString.split(" ").length > 2) throw Error(`Too much arguments mkdir command only support one argument`)
        if(!this.dirName) throw Error(`You need to input directory name`);
    }
    doCommand(){
        return this.executeAt.makeDirectory(this.dirName)
    }
}

class Touch extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    parse(){
        super.parse();
        this.fileName = this.path.pop();
    }
    validate(){
        if(this.inputString.split(" ").length > 2) throw Error(`Too much arguments touch command only support one argument`)
        if(!this.fileName) throw Error(`You need to input file name`);
    }
    doCommand(){
        return this.executeAt.updateFileDate(this.fileName)
    }

}

class Print extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    doCommand(){return this.executeAt.toString()}
}

class Pwd extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    doCommand(){
        return this.executeAt.getAbsolutePath();
    }
}


class Rm extends Command{
    constructor(fileSystem){
        super(fileSystem)
        this.confirmed = false;
    }
    parse(){
        super.parse();
        this.entryName = this.path.pop();
    }
    validate(){
        if(this.inputString.split(" ").length > 2) throw Error(`Too much arguments rm command only support one argument`)
        if(!this.entryName) throw Error(`You need to input file or directory name`);
    }
    doCommand(){
        if(!this.confirmed){
            //まだconfirmされていなければ、confirmをtrueにしたうえで、例外を返す
            this.confirmed = true;
            throw new UnconfirmedError("You need to confirm")
        }
        this.executeAt.deleteEntry(this.entryName)
        //confirmed プロパティーを初期値に戻しておく
        this.confirmed = false;
    }
}

///////////Confirmされていないのに削除しようとした時に返すエラー（Rmでしか使わない）//////////////
class UnconfirmedError extends Error {
    constructor(message) {
      super(message);
      this.name = 'Unconfirmed Error';
    }
  }


class Cd extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    traverse(){
        if(this.path.length===0) {
            this.currentDir = this.root;
            return;
            }
        if(this.path[0] ===　".." && this.fileSystem.currentDir.getName() === "root") {
            throw Error(`root directory does not have parent directory`)
            }
        if(this.path[0] ===　".."){
            this.fileSystem.currentDir = this.fileSystem.currentDir.parent;
            return;
            }
        if(this.path[0] ===　".") {return}
        super.traverse()
        this.fileSystem.currentDir = this.executeAt.getThisDir();
    }
}

class Move extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    parse(){
        super.parse();
        this.targetDir = this.parsedInputStringArr.pop().split("/");
        this.entryName = this.path.pop();
    }
    doCommand(){
        // ターゲットディレクトリを削除し、戻り値で削除したエントリーを取得する
        let deletedEntry = this.executeAt.deleteEntry(this.entryName);
        // 移動先のディレクトリをパスに設定し、そのディレクトリまでトラバースする
        this.path = this.targetDir;
        this.traverse()
        // トラバース先で削除したエントリーを追加する
        this.executeAt.addEntry(deletedEntry);
    }
}

class Copy extends Command{
    constructor(fileSystem){
        super(fileSystem)
    }
    parse(){
        super.parse();
        this.targetDir = this.parsedInputStringArr.pop().split("/");
    }
    doCommand(){   
        // ターゲットディレクトリをdeepCopyし、取得する
        let copiedEntry = this.executeAt.createDeepCopy();
        // コピー先のディレクトリをパスに設定し、そのディレクトリまでトラバースする
        this.path = this.targetDir;
        this.traverse();
        // トラバース先でコピーしたエントリーを追加する
        this.executeAt.addEntry(copiedEntry);
    }

}

///////////Parser　文字列を受け取り、Parseして返す//////////////

class Parser{

    static split(inputString){
        inputString = inputString.replace(/\s{2,}/," ");
        return inputString.trim().split(" ");
    }

    static setOption(possibleOptionStringArr){ //arr
        let result = [];
        possibleOptionStringArr.forEach(ele=>{
            let matchOption = ele.match(/-[a-z]{1,2}/g)?ele.match(/-[a-z]{1,2}/g)[0]:null;
            if(!matchOption)return result
            result.push(matchOption);
        })
        return result;
    }
    static setPath(possibleArgumentsArr,option){ // arr
        if(possibleArgumentsArr.length===0||possibleArgumentsArr === undefined) return [];
        let result = option.length === 0? possibleArgumentsArr[0].split("/"):[];
        result = possibleArgumentsArr.slice(option.length).length === 0 ? []: possibleArgumentsArr.slice(option.length)[0].split("/");
        return result;
    }
}

///////////CommandCreator ユーザーインプットの最初の単語から該当するCommandインスタンスを返す//////////////

class CommandCreater{
    static VALID_COMMANDS = Object.freeze({
        ls:Ls,
        mkdir:Mkdir,
        touch:Touch,
        print:Print,
        pwd:Pwd,
        rm:Rm,
        cd:Cd,
        move:Move,
        copy:Copy,
    })
    constructor(fileSystem){
        this.commands = {};
        for(let command in CommandCreater.VALID_COMMANDS){
            this.commands[command] = new CommandCreater.VALID_COMMANDS[command](fileSystem);
        }
    }

    getCommandInstance(command){
        if(command==='y'&& this.commands["rm"].confirmed===true){
            return this.commands["rm"];
        }
        if(command==='n'&& this.commands["rm"].confirmed===true){
            this.commands["rm"].confirmed = false;
            throw Error('Stop to remove');

        } 
        if(!this.commands[command]) throw Error(`Command Not Found ${command}`);
        // 初期化して返す
        let commandObj = this.commands[command];
        commandObj.executeAt = null;
        commandObj.option = [];
        commandObj.path = [];
        commandObj.isAbsolutePath = false;
        return commandObj;
    }

}

///////////CommandHistoryStack　ユーザーの入力して文字列をStackに追加していき、↑↓で履歴取得できるようにする//////////////
class CommandHistoryNode{
    constructor(commandInputString){
        this.commandInputString = commandInputString;
        this.up = null;
        this.down =null;
    }
}

class CommandHistoryStack{
    constructor() {
        this.top = null;
        this.bottom = null;
    }
    push(commnadInputString){ 
        if(this.top === null){
            this.top = new CommandHistoryNode(commnadInputString);
            this.bottom = this.top;
        }else{
            let newNode = new CommandHistoryNode(commnadInputString);
            let tmp = this.top;
            this.top = newNode;
            newNode.down = tmp;
            newNode.down.up = newNode;
        }
        this.setIteratorToTop();
    }
    pop(){ 
        if(this.top === null) return null;
        let tmp = this.top;
        this.top = this.top.down;
        return tmp.commandInputString
    }
    peek(){
        if(this.top === null) return null;
        return this.top.commandInputString
    }

    setIteratorToTop(){
        this.iterator = this.top;
    }
}


///////////Controller＆View//////////////


class Controller{
    static controlCommand(commandInputString){
        //commandHistoryStackにpush
        ch.push(commandInputString)
        View.renderCommand(commandInputString);
        let command;
        try{
            command = cc.getCommandInstance(commandInputString.split(" ")[0])
            let result = command.execute(commandInputString);
            if(!result) return;
            View.renderResult(result)
        }catch(e){
            if(e instanceof UnconfirmedError){
                View.renderConfirmMessage();
            }else{
                View.renderResult(e.message);
            }            
        }
    }
    static controllHistroyCommand = function(event){
        if(event.key=="ArrowUp"){
            if(ch.iterator){
                View.renderHistoryCommand(ch.iterator.commandInputString);
                ch.iterator = ch.iterator.down? ch.iterator.down : ch.iterator;
            }
        }
        if(event.key == "ArrowDown"){
            if(ch.iterator.up){
                ch.iterator = ch.iterator.up;
                View.renderHistoryCommand(ch.iterator.commandInputString);
            }
        }
    }
    static init = function(){
        View.addHandlerCommand(this.controlCommand);
        View.addHandlerHistory(this.controllHistroyCommand);
    }
}


class View{
    static renderCommand(commandInputString){ 
        config.outputTarget.innerHTML += `
        <p class="text-white my-0">
        <span style='color:green'>${config.user}</span>
        <span style='color:magenta'>@</span>
        <span style='color:blue'>recursionist</span>
        : ${commandInputString}     
        </p>
        ` 
        View.clearInput();
        View.scrollToBottom();
    }
    static clearInput(){
        config.inputTarget.value = ""; 
    }
    static scrollToBottom(){
        config.outputTarget.scrollTop = config.outputTarget.scrollHeight;
    }
    static renderConfirmMessage(){
        config.outputTarget.innerHTML +=`
        <p class="text-white my-0">Are you sure? y/n </p>
        `
        View.scrollToBottom();
    }
    static renderResult(result){ 
        config.outputTarget.innerHTML += `
        <p class="text-white my-0">
        : ${result?result:""}     
        </p>
        `
        View.scrollToBottom();
    }
    static renderHistoryCommand(command){ 
        config.inputTarget.value = command;
    }
    static addHandlerCommand(handler){ 
        config.inputTarget.addEventListener('keypress',function(e){
            if(!this.value) return;
            if(e.key === "Enter") handler(this.value);
        })
    }
    static addHandlerHistory(handler){ 
        config.inputTarget.addEventListener("keydown",function(e){
            handler(e);
        })
    }
}



///////////初期化//////////////
let fs = new FileSystem();
let cc = new CommandCreater(fs);
let ch = new CommandHistoryStack();
Controller.init();
