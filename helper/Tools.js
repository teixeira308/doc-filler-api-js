Logmessage = (message) => {
    //calculando GMT-3
    var now = new Date();
    const offset = -3 * 60 * 60 * 1000; 
    const gmtMinus3Date = new Date(now.getTime() + offset);
    //log de sistema
    console.log(gmtMinus3Date.toUTCString(),"->",message)
}


module.exports = {Logmessage };