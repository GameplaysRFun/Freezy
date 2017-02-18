module.exports = {
    log: function (val, prefix) {
        return console.log('\u001b[32m'+ (prefix ? prefix : 'info: ') + '\u001b[0m' + val);
    },
    error: function (val, prefix) {
        return console.log('\u001b[31m'+ (prefix ? prefix : 'info: ') + '\u001b[0m' + val);
    },
    green: function (val) {
        return console.log('\u001b[32m' + val + '\u001b[0m');
    },
    red: function (val) {
        return console.log('\u001b[31m' + val + '\u001b[0m');
    },
    blue: function (val) {
        return console.log('\u001b[34m' + val + '\u001b[0m');
    },
    cyan: function (val) {
        return console.log('\u001b[36m' + val + '\u001b[0m');
    },
    black: function (val) {
        return console.log('\u001b[30m' + val + '\u001b[0m');
    },
    magenta: function (val) {
        return console.log('\u001b[35m' + val + '\u001b[0m');
    },
    white: function (val) {
        return console.log('\u001b[37m' + val + '\u001b[0m');
    }
};
