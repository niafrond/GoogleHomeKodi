import * as Config from "./kodi-hosts.config";

const Helper = require('./helpers.js');
exports.kodiDo = (request, response) => {
    let Kodi = request.kodi;
    let message = request.query.q;
    //Mega traduction des mots envoyés



    for (let [key, value] of Object.entries(Config.talkPatterns)) {
        for(let i= 0; i < value.length; i++)
        {
            let re = new RegExp(value[i]);
            if(re.test(message)){
                let content = RegExp.rightContext;
                console.log(key +" asked : "+ RegExp.rightContext);
                request.query.q=content;
                let data;
                eval("data=Helper."+key+"(request, response);");
                return data;
            }
        }
    }


};