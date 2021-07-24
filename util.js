var PAYLOAD = {
    defaultMode : 'json',
    encode: function(object, mode){
        //try{
            switch(mode || PAYLOAD.defaultMode){
                case 'cbor' : return CBOR.stringify(object);
                case 'json' : return JSON.stringify(object);
                case 'pretty-json' : return JSON.stringify(object, null, '    ');
                default : throw new Error('Unrecognized parse format: '+ mode);
            }
        //}catch(ex){}
    },
    stringify: function(object, mode){
        return PAYLOAD.encode(object, mode);
    },
    decode : function(payload, mode){
        //try{
            switch(mode || PAYLOAD.defaultMode){
                case 'cbor' : return CBOR.decode(payload);
                case 'json' : return JSON.decode(payload);
                case 'pretty-json' : return JSON.decode(payload, null, '    ');
                default : throw new Error('Unrecognized parse format: '+ mode);
            }
        //}catch(ex){}
    }
}
module.exports = {
    payload: PAYLOAD
}
